// scraper/gidstats-scraper-hybrid.js
// 🔥 V7.0 - WITH FIGHT HISTORY (Last 5 Fights)

const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

const BASE_URL = 'https://gidstats.com';
const OUTPUT_DIR = path.join(__dirname, '../public/data');

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function cleanText(text) {
  return text ? text.replace(/\s+/g, ' ').trim() : '';
}

function fixDuplicateNumber(text) {
  if (!text) return text;
  const str = String(text);
  if (str.length > 2 && str.length % 2 === 0) {
    const half = str.length / 2;
    const firstHalf = str.substring(0, half);
    const secondHalf = str.substring(half);
    if (firstHalf === secondHalf && !isNaN(firstHalf)) {
      return firstHalf;
    }
  }
  return text;
}

function cleanFighterName(rawName) {
    if (!rawName) return '';
    const match = rawName.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
    return match ? match[1].trim() : rawName.trim();
}

function cleanTimeFormat(timeStr) {
    if (!timeStr) return timeStr;
    const cleaned = String(fixDuplicateNumber(timeStr));
    const match = cleaned.match(/^(\d+):(\d{2})/);
    return match ? `${match[1]}:${match[2]}` : cleaned;
}

function cleanPercentage(percentStr) {
    if (!percentStr) return percentStr;
    const cleaned = String(fixDuplicateNumber(percentStr));
    const match = cleaned.match(/^(\d+)%/);
    return match ? `${match[1]}%` : cleaned;
}

function parseRecord(record) {
    const match = record.match(/(\d+)\s*-\s*(\d+)\s*-\s*(\d+)/);
    if (!match) return { wins: 0, losses: 0, draws: 0 };
    return { wins: parseInt(match[1]) || 0, losses: parseInt(match[2]) || 0, draws: parseInt(match[3]) || 0 };
}

function parseWinMethod(text) {
    const match = text.match(/(\d+)\s*\((\d+)%\)/);
    if (!match) return null;
    return { count: parseInt(match[1]) || 0, percent: match[2] + '%' };
}

// 🔥 NEW - SCRAPE FIGHT HISTORY FROM FIGHTER PAGE
async function scrapeFightHistory(fighterUrl, page) {
    console.log(`      📜 Fight History: ${fighterUrl.split('/fighters/')[1]}`);
    
    try {
        await page.goto(fighterUrl, { waitUntil: 'networkidle2', timeout: 45000 });
        await delay(1200);

        const html = await page.content();
        const $ = cheerio.load(html);

        const fightHistory = [];

        // Find all fight rows in PRO Results table
        $('.history-list__item').each((i, el) => {
            // Skip cancelled fights
            if ($(el).hasClass('history-list__item--cancelled')) {
                return;
            }

            // Only take confirmed fights (Win/Loss/Draw)
            const hasResult = $(el).hasClass('history-list__item--win') || 
                            $(el).hasClass('history-list__item--lose') || 
                            $(el).hasClass('history-list__item--draw');

            if (!hasResult) {
                return; // Skip upcoming/unconfirmed fights
            }

            // Extract opponent
            const opponentLink = $(el).find('.pair a');
            const opponent = cleanText(opponentLink.text());
            const opponentUrl = opponentLink.attr('href');

            // Extract result
            let result = 'N/A';
            if ($(el).hasClass('history-list__item--win')) result = 'Win';
            else if ($(el).hasClass('history-list__item--lose')) result = 'Loss';
            else if ($(el).hasClass('history-list__item--draw')) result = 'Draw';

            // Extract method, round, time
            const method = cleanText($(el).find('.method .text--down, .method span').text());
            const round = cleanText($(el).find('.round span').text());
            const time = cleanText($(el).find('.time span').text());

            // Extract event & date
            const dateText = cleanText($(el).find('.date').text());
            const eventMatch = dateText.match(/•\s*(.+?)(?:\s*•|$)/);
            const event = eventMatch ? eventMatch[1].trim() : '';
            const dateMatch = dateText.match(/^(\d{2}\.\d{2}\.\d{4})/);
            const date = dateMatch ? dateMatch[1] : '';

            // Extract billing (Main Event, Co-Main, Prelims)
            let billing = 'Preliminary Card'; // Default
            $('.info-list__item').each((j, infoEl) => {
                const label = cleanText($(infoEl).find('.top-text').text()).toLowerCase();
                if (label.includes('billing')) {
                    billing = cleanText($(infoEl).find('.bottom-text').text());
                }
            });

            fightHistory.push({
                opponent: opponent || 'Unknown',
                opponentUrl: opponentUrl ? (opponentUrl.startsWith('http') ? opponentUrl : BASE_URL + opponentUrl) : null,
                result,
                method: method || 'N/A',
                round: round || 'N/A',
                time: time || 'N/A',
                event: event || 'N/A',
                date: date || 'N/A',
                billing
            });
        });

        // Return last 5 fights
        const last5 = fightHistory.slice(0, 5);
        console.log(`         ✅ ${last5.length} fights scraped`);
        return last5;

    } catch (error) {
        console.error(`         ❌ Fight History Error: ${error.message}`);
        return [];
    }
}

// 🔥 BETTER FIGHTER SCRAPER (with fight history)
async function scrapeFighterProfile(fighterUrl, page) {
    console.log(`      🔍 Fighter: ${fighterUrl.split('/fighters/')[1]}`);
    try {
        await page.goto(fighterUrl, { waitUntil: 'networkidle2', timeout: 45000 });

        // 🔥 CLICK "SHOW STATS" BUTTON
        try {
          await delay(1500);
          
          const showStatsClicked = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button, .btn, [role="button"], a'));
            const showStatsBtn = buttons.find(btn => 
              btn.textContent.toLowerCase().includes('show') && 
              btn.textContent.toLowerCase().includes('stats')
            );
            
            if (showStatsBtn) {
              showStatsBtn.click();
              return true;
            }
            return false;
          });

          if (showStatsClicked) {
            console.log('         ✅ Clicked "Show Stats"!');
            await delay(2000);
          }
        } catch (e) {
          console.log('         ⚠️  Dropdown error');
        }

        const html = await page.content();
        const $ = cheerio.load(html);

        const fighter = {
            url: fighterUrl,
            name: cleanFighterName(cleanText($('h1.name').text())),
            nickname: cleanText($('.nick-name__name').text()),
            ufcRanking: null, pfpRanking: null, wins: null, losses: null, draws: null, noContests: null,
            age: null, height: null, heightCm: null, weight: null, weightKg: null, reach: null, reachCm: null, legReach: null, legReachCm: null,
            style: null, stance: null, born: null, country: null, avgFightTime: null, firstRoundFinishes: null, avgFightTimeUFC: null, ufcBoutsForStats: null,
            sigStrikesLandedPerMin: null, sigStrikesAbsorbedPerMin: null, strikingAccuracy: null, sigStrikeDefense: null, sigStrikesLanded: null, sigStrikesAttempted: null, knockdownAvg: null,
            totalStrikesLanded: null, totalStrikesAttempted: null, totalStrikingAccuracy: null, takedownsPerBout: null, takedownAccuracy: null, takedownDefense: null,
            takedownsLanded: null, takedownsAttempted: null, submissionsAvg: null, standingCount: null, standingPercent: null, clinchCount: null, clinchPercent: null,
            groundCount: null, groundPercent: null, headCount: null, headPercent: null, bodyCount: null, bodyPercent: null, legCount: null, legPercent: null,
            winsKO: null, winsSub: null, winsDec: null, winMethodKOPercent: null, winMethodSubPercent: null, winMethodDecPercent: null, promotionStats: [],
            fightHistory: [] // 🔥 NEW
        };
        
        // Rankings
        $('.rating-fighter-box').each((i, el) => {
            const text = cleanText($(el).text());
            if (text.includes('UFC')) {
                const match = text.match(/#(\d+)/);
                if (match) fighter.ufcRanking = match[1];
            }
        });

        // Record
        const record = parseRecord(cleanText($('.data-list__item--counts .counts').text()));
        fighter.wins = record.wins; 
        fighter.losses = record.losses; 
        fighter.draws = record.draws;

        // Physical Stats
        $('.data-list__item').each((i, el) => {
            const label = cleanText($(el).text()).toLowerCase();
            const value = cleanText($(el).find('.value').text());
            const metric = cleanText($(el).find('.metric').text());
            
            if (label.includes('age')) fighter.age = parseInt(value) || null;
            else if (label.includes('height')) { 
              fighter.height = value; 
              fighter.heightCm = metric.replace('cm', '').trim(); 
            }
            else if (label.includes('weigh-in')) { 
              fighter.weight = value; 
              fighter.weightKg = metric.replace('cm', '').trim(); 
            }
            else if (label.includes('reach') && !label.includes('leg')) { 
              fighter.reach = value; 
              fighter.reachCm = metric.replace('cm', '').trim(); 
            }
            else if (label.includes('leg reach')) { 
              fighter.legReach = value; 
              fighter.legReachCm = metric.replace('cm', '').trim(); 
            }
        });

        // Style, Stance, Born
        $('.data-list__item--new-style').each((i, el) => {
            const label = cleanText($(el).text()).toLowerCase();
            const value = cleanText($(el).find('.new-style').text());
            if (label.includes('style')) fighter.style = value;
            else if (label.includes('stance')) fighter.stance = value;
            else if (label.includes('born')) fighter.born = value;
        });

        fighter.country = cleanText($('.data-list__item--country').text());

        // 🔥 DETAILED STATS
        $('.stats-list__item').each((i, el) => {
            const $item = $(el);
            
            const leftText = cleanText($item.find('.left-block .text').text()).toLowerCase();
            const leftNumber = cleanText($item.find('.left-block .number').text());
            const rightText = cleanText($item.find('.right-block .text').text()).toLowerCase();
            const rightNumber = cleanText($item.find('.right-block .number').text());
            
            const cleanLeft = fixDuplicateNumber(leftNumber);
            const cleanRight = fixDuplicateNumber(rightNumber);
            
            const statMap = {
              'avg fight time': (val) => {
                if (leftText.includes('ufc')) {
                  fighter.avgFightTimeUFC = cleanTimeFormat(val);
                } else {
                  fighter.avgFightTime = cleanTimeFormat(val);
                }
              },
              'first round finishes': (val) => fighter.firstRoundFinishes = parseInt(val) || null,
              'ufc bouts for calculating statistics': (val) => fighter.ufcBoutsForStats = parseInt(val) || null,
              'takedowns per bout': (val) => fighter.takedownsPerBout = parseFloat(val) || null,
              'takedowns landed': (val) => fighter.takedownsLanded = parseInt(val) || null,
              'takedown attempted': (val) => fighter.takedownsAttempted = parseInt(val) || null,
              'successful takedown': (val) => fighter.takedownAccuracy = cleanPercentage(val),
              'takedown defense': (val) => fighter.takedownDefense = cleanPercentage(val),
              'sig. strikes landed (per min)': (val) => fighter.sigStrikesLandedPerMin = parseFloat(val) || null,
              'sig. strikes absorbed (per min)': (val) => fighter.sigStrikesAbsorbedPerMin = parseFloat(val) || null,
              'sig. strikes landed': (val) => {
                if (!leftText.includes('per min') && !rightText.includes('per min')) {
                  fighter.sigStrikesLanded = parseInt(val) || null;
                }
              },
              'sig. strikes attempted': (val) => fighter.sigStrikesAttempted = parseInt(val) || null,
              'significant strikes accuracy': (val) => fighter.strikingAccuracy = cleanPercentage(val),
              'sig. strikes defense': (val) => fighter.sigStrikeDefense = cleanPercentage(val),
              'striking accuracy': (val) => fighter.totalStrikingAccuracy = cleanPercentage(val),
              'avg. knockdowns per fight': (val) => fighter.knockdownAvg = parseFloat(val) || null,
            };

            for (const [key, handler] of Object.entries(statMap)) {
              if (leftText.includes(key)) {
                handler(cleanLeft);
                break;
              }
            }

            for (const [key, handler] of Object.entries(statMap)) {
              if (rightText.includes(key)) {
                handler(cleanRight);
                break;
              }
            }
        });

        // Promotion Stats
        $('.promotion-stats table tbody tr').each((i, el) => {
            const promotion = cleanText($(el).find('td').eq(0).text());
            const bouts = parseInt(cleanText($(el).find('td').eq(1).text())) || 0;
            if (promotion && bouts > 0) {
              fighter.promotionStats.push({ promotion, bouts });
            }
        });

        // Strike Position Distribution
        $('.punch-list__item').each((i, el) => {
            const label = cleanText($(el).find('.punch-list__text').text()).toLowerCase();
            const valueText = cleanText($(el).find('.punch-list__text--down').text());
            const match = valueText.match(/(\d+)\s*\((\d+)%\)/);
            if (!match) return;
            
            const count = parseInt(match[1]) || 0;
            const percent = match[2] + '%';
            
            if (label.includes('standing')) { 
              fighter.standingCount = count; 
              fighter.standingPercent = percent; 
            }
            else if (label.includes('clinch')) { 
              fighter.clinchCount = count; 
              fighter.clinchPercent = percent; 
            }
            else if (label.includes('ground')) { 
              fighter.groundCount = count; 
              fighter.groundPercent = percent; 
            }
        });

        // Target Distribution
        $('.center-block .target-block').each((i, el) => {
            const target = cleanText($(el).find('.target').text()).toLowerCase();
            const count = parseInt(cleanText($(el).find('.quantity').text())) || 0;
            const percent = cleanText($(el).find('.percent').text());
            
            if (target.includes('head')) { 
              fighter.headCount = count; 
              fighter.headPercent = percent; 
            }
            else if (target.includes('body')) { 
              fighter.bodyCount = count; 
              fighter.bodyPercent = percent; 
            }
            else if (target.includes('legs') || target.includes('leg')) { 
              fighter.legCount = count; 
              fighter.legPercent = percent; 
            }
        });

        // Win Methods
        $('.win-lose-block .wins-list__item').each((i, el) => {
            const label = cleanText($(el).find('.wins-list__text').first().text());
            const value = cleanText($(el).find('.wins-list__text--down').text());
            const parsed = parseWinMethod(value);
            
            if (!parsed) return;
            
            if (label.includes('KO')) { 
              fighter.winsKO = parsed.count; 
              fighter.winMethodKOPercent = parsed.percent; 
            }
            else if (label.includes('Dec')) { 
              fighter.winsDec = parsed.count; 
              fighter.winMethodDecPercent = parsed.percent; 
            }
            else if (label.includes('Sub')) { 
              fighter.winsSub = parsed.count; 
              fighter.winMethodSubPercent = parsed.percent; 
            }
        });

        // 🔥 SCRAPE FIGHT HISTORY
        fighter.fightHistory = await scrapeFightHistory(fighterUrl, page);

        console.log(`         ✅ ${fighter.name} - Fights:${fighter.fightHistory.length} TD:${fighter.takedownDefense || 'N/A'}`);
        return fighter;

    } catch (error) {
        console.error(`         ❌ Error: ${error.message}`);
        return null;
    }
}

async function scrapeFightComparison(fightUrl, page, presetRounds = null) {
    console.log(`   🥊 Fight: ${fightUrl.split('/').pop()}`);
    try {
        await page.goto(fightUrl, { waitUntil: 'networkidle2', timeout: 45000 });
        const html = await page.content();
        const $ = cheerio.load(html);

        const fight = {
            url: fightUrl,
            eventName: cleanText($('.center-block__name').text()),
            eventDate: cleanText($('.center-block__date').text()),
            eventTime: cleanText($('.center-block__time').text()),
            weightClass: cleanText($('.center-block__weight, .weight').first().text()),
            rounds: presetRounds || 3,
            boutFormat: null, 
            fighter1: {}, 
            fighter2: {}
        };

        // 🔥 IF NO PRESET, TRY TO PARSE FROM PAGE
        if (!presetRounds) {
            const clockText = cleanText($('.center-block__clock').text());
            const roundsMatch = clockText.match(/(\d+)\s*x\s*5/i);
            
            if (roundsMatch) {
                fight.rounds = parseInt(roundsMatch[1]);
            } else if (fight.weightClass.toLowerCase().includes('title') || 
                       fight.eventName.toLowerCase().includes('title')) {
                fight.rounds = 5;
            }
        }
        
        fight.boutFormat = `${fight.rounds}x5`;

        const processFighter = (selector) => {
            const block = $(selector);
            const fighterData = {};
            fighterData.name = cleanText(block.find('.name').text());
            const href = block.find('.name').attr('href');
            if (href) fighterData.url = href.startsWith('http') ? href : BASE_URL + href;
            const ranking = cleanText(block.find('.events__fighter-status-box span').last().text());
            if (ranking.includes('#')) fighterData.ranking = ranking;
            
            block.find('.data-list__item').each((i, el) => {
                const label = cleanText($(el).text()).toLowerCase();
                const value = cleanText($(el).find('span').first().text());
                const metric = cleanText($(el).find('.metric').text());
                if (label.includes('age')) fighterData.age = parseInt(value) || null;
                else if (label.includes('reach') && !label.includes('leg')) { fighterData.reach = value; fighterData.reachCm = metric.replace('cm', '').trim(); }
                else if (label.includes('height')) { fighterData.height = value; fighterData.heightCm = metric.replace('cm', '').trim(); }
                else if (label.includes('leg')) { fighterData.legReach = value; fighterData.legReachCm = metric.replace('cm', '').trim(); }
                else if (label.includes('weigh-in')) { fighterData.lastWeighIn = value; fighterData.lastWeighInKg = metric.replace('kg', '').trim(); }
            });
            return fighterData;
        };

        fight.fighter1 = processFighter('.fighter1');
        fight.fighter2 = processFighter('.fighter2');

        console.log(`      ✅ ${fight.fighter1.name} vs ${fight.fighter2.name} - ${fight.rounds} rounds`);
        return fight;
    } catch (error) {
        console.error(`      ❌ Error: ${error.message}`);
        return null;
    }
}

async function scrapeEvent(eventUrl, page) {
    console.log(`\n📅 Event: ${eventUrl.split('/').pop()}\n`);
    try {
        await page.goto(eventUrl, { waitUntil: 'networkidle2', timeout: 45000 });
        const html = await page.content();
        const $ = cheerio.load(html);

        const event = {
            url: eventUrl,
            name: cleanText($('.tournament-top__title, .c-hero__headline, .place.fa__event').first().text()),
            date: cleanText($('.tournament-date .date, .date.fa__event').first().text()),
            time: cleanText($('.tournament-date .time, .time.fa__event').first().text()),
            location: cleanText($('.tournament-date .address, .address.fa__event').first().text()),
            fights: []
        };
        
        console.log(`   📍 ${event.name}\n   📅 ${event.date} ${event.time}\n   🏟️  ${event.location}\n`);

        // 🔥 GET FIGHT LINKS WITH ROUNDS INFO
        const fightData = [];
        
        $('.other-fights-list__item').each((i, el) => {
            const $item = $(el);
            const fightLink = $item.find('.other-fights-list__link').attr('href');
            
            if (fightLink && fightLink.includes('_vs_')) {
                const fullUrl = fightLink.startsWith('http') ? fightLink : `${BASE_URL}${fightLink}`;
                
                // 🔥 EXTRACT ROUNDS FROM THIS PAGE
                const clockText = cleanText($item.find('.center-block__clock').text());
                const roundsMatch = clockText.match(/(\d+)\s*x\s*\d+/i);
                
                let rounds = 3; // Default
                if (roundsMatch) {
                    rounds = parseInt(roundsMatch[1]);
                }
                
                fightData.push({
                    url: fullUrl,
                    rounds: rounds
                });
                
                console.log(`   🥊 ${fightLink.split('/').pop()} - ${rounds} rounds`);
            }
        });
        
        console.log(`\n   🥊 Found ${fightData.length} fights\n`);

        // 🔥 NOW SCRAPE EACH FIGHT WITH CORRECT ROUNDS
        for (const data of fightData) {
            const fight = await scrapeFightComparison(data.url, page, data.rounds);
            if (fight) event.fights.push(fight);
            await delay(500);
        }
        
        return event;
    } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        return null;
    }
}

// 🔥 Main Function
async function scrapeAllEvents() {
    console.log('🚀 GIDSTATS SCRAPER V7.0 - WITH FIGHT HISTORY\n' + '='.repeat(70) + '\n');
    
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    await page.setViewport({ width: 1920, height: 1080 });

    try {
      const eventUrls = [
        'https://gidstats.com/events/ufc_fight_night-2560/',  // UFC Qatar
        'https://gidstats.com/events/ufc_323-2567/',          // UFC 323
        'https://gidstats.com/events/ufc_fight_night-2561/',  // UFC Vegas 112
        'https://gidstats.com/events/ufc_324-2604/',          // UFC 324
      ];

      console.log(`🔍 Processing ${eventUrls.length} UFC events...\n`);
      
      const allEvents = [];
      const allFighters = new Map();

      for (const eventUrl of eventUrls) {
          try {
            console.log(`📍 Loading: ${eventUrl.split('/').slice(-2)[0]}`);
            const event = await scrapeEvent(eventUrl, page);
            
            if (event && event.fights && event.fights.length > 0) {
              allEvents.push(event);
              for (const fight of event.fights) {
                  if (fight.fighter1.url) allFighters.set(fight.fighter1.url, fight.fighter1.name);
                  if (fight.fighter2.url) allFighters.set(fight.fighter2.url, fight.fighter2.name);
              }
              console.log(`   ✅ ${event.name}: ${event.fights.length} fights\n`);
            } else {
              console.log(`   ⚠️  Skipped: No fights found\n`);
            }
          } catch (error) {
            console.log(`   ❌ Error: ${error.message}\n`);
          }
          
          await delay(1000);
      }

      console.log(`\n\n🔥 Scraping ${allFighters.size} unique fighters...\n`);
      const fighters = [];
      let count = 0;
      let withFightHistory = 0;

      for (const [fighterUrl] of allFighters) {
          count++;
          console.log(`   ⚡ ${count}/${allFighters.size}`);
          const fighter = await scrapeFighterProfile(fighterUrl, page);
          if (fighter) {
            fighters.push(fighter);
            if (fighter.fightHistory && fighter.fightHistory.length > 0) withFightHistory++;
          }
          await delay(800);
      }
      
      await browser.close();

      const output = {
          scrapedAt: new Date().toISOString(),
          source: 'GIDStats.com',
          dataVersion: '7.0-WITH-FIGHT-HISTORY',
          events: allEvents,
          fighters: fighters,
          stats: {
              totalEvents: allEvents.length,
              totalFights: allEvents.reduce((sum, e) => sum + (e.fights ? e.fights.length : 0), 0),
              totalFighters: fighters.length,
              withFightHistory: withFightHistory,
              coveragePercent: fighters.length > 0 ? Math.round((withFightHistory / fighters.length) * 100) + '%' : '0%'
          }
      };

      const outputPath = path.join(OUTPUT_DIR, 'gidstats-final.json');
      await fs.mkdir(OUTPUT_DIR, { recursive: true });
      await fs.writeFile(outputPath, JSON.stringify(output, null, 2));

      console.log('\n' + '='.repeat(70));
      console.log('✅ SCRAPING COMPLETE!');
      console.log('='.repeat(70));
      console.log(`📅 Events: ${output.stats.totalEvents}`);
      console.log(`🥊 Fights: ${output.stats.totalFights}`);
      console.log(`👤 Fighters: ${output.stats.totalFighters}`);
      console.log(`📜 Fight History: ${withFightHistory} (${output.stats.coveragePercent})`);
      console.log(`📁 Output: ${outputPath}`);
      console.log('='.repeat(70) + '\n');

    } catch (error) {
      console.error('❌ Critical Error:', error);
      await browser.close();
      throw error;
    }
}

scrapeAllEvents().catch(error => {
  console.error("Critical error:", error);
  process.exit(1);

});