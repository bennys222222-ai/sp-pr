const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

const BASE_URL = 'https://gidstats.com';
const OUTPUT_DIR = path.join(__dirname, '../public/data');

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 30000
      });
      return response.data;
    } catch (error) {
      if (i === retries - 1) throw error;
      await delay(3000 * (i + 1));
    }
  }
}

function cleanText(text) {
  return text ? text.replace(/\s+/g, ' ').trim() : '';
}

// 🔧 FIX: Remove duplicate numbers like "671671" → "671"
function fixDuplicateNumber(text) {
  if (!text) return text;
  const str = String(text);
  
  // Check if it's a duplicate pattern like "671671"
  const half = Math.floor(str.length / 2);
  const firstHalf = str.substring(0, half);
  const secondHalf = str.substring(half);
  
  if (firstHalf === secondHalf && firstHalf.length > 0) {
    console.log(`      🔧 FIX: Duplicate number "${str}" → "${firstHalf}"`);
    return firstHalf;
  }
  
  return text;
}

// 🔧 FIX: Clean fighter name (remove concatenated names)
function cleanFighterName(rawName) {
  if (!rawName) return '';
  
  // Names are usually concatenated without spaces
  // Example: "Arman TsarukyanMichaelTrizanoGavinTucker"
  // We want to extract just the first full name
  
  // Pattern: Find first occurrence of capital letter followed by lowercase, then another capital
  const match = rawName.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
  
  if (match) {
    const cleanName = match[1].trim();
    if (cleanName !== rawName.trim()) {
      console.log(`      🔧 FIX: Name "${rawName}" → "${cleanName}"`);
    }
    return cleanName;
  }
  
  return rawName.trim();
}

// 🔧 FIX: Clean time format "9:1537" → "9:15" or "13:3813" → "13:38"
function cleanTimeFormat(timeStr) {
  if (!timeStr) return timeStr;
  
  // First fix duplicates
  timeStr = String(fixDuplicateNumber(timeStr));
  
  // Now extract MM:SS format
  const match = timeStr.match(/^(\d+):(\d{2})/);
  if (match) {
    const cleaned = `${match[1]}:${match[2]}`;
    if (cleaned !== timeStr) {
      console.log(`      🔧 FIX: Time "${timeStr}" → "${cleaned}"`);
    }
    return cleaned;
  }
  
  return timeStr;
}

// 🔧 FIX: Clean percentage "59%59" → "59%"
function cleanPercentage(percentStr) {
  if (!percentStr) return percentStr;
  
  // First fix duplicates
  percentStr = String(fixDuplicateNumber(percentStr));
  
  const match = percentStr.match(/^(\d+)%/);
  if (match) {
    const cleaned = `${match[1]}%`;
    if (cleaned !== percentStr) {
      console.log(`      🔧 FIX: Percentage "${percentStr}" → "${cleaned}"`);
    }
    return cleaned;
  }
  
  return percentStr;
}

function parseRecord(record) {
  const match = record.match(/(\d+)\s*-\s*(\d+)\s*-\s*(\d+)/);
  if (!match) return { wins: 0, losses: 0, draws: 0 };
  
  return {
    wins: parseInt(match[1]) || 0,
    losses: parseInt(match[2]) || 0,
    draws: parseInt(match[3]) || 0
  };
}

function parseWinMethod(text) {
  const match = text.match(/(\d+)\s*\((\d+)%\)/);
  if (!match) return null;
  
  return {
    count: parseInt(match[1]) || 0,
    percent: match[2] + '%'
  };
}

// 🔥 Scrape Fighter Profile (Complete Stats)
async function scrapeFighterProfile(fighterUrl) {
  console.log(`      🔍 Fighter: ${fighterUrl.split('/fighters/')[1]}`);
  
  try {
    await delay(2000);
    const html = await fetchWithRetry(fighterUrl);
    const $ = cheerio.load(html);
    
    const rawName = cleanText($('.fighter .name').text());
    const cleanedName = cleanFighterName(rawName);
    
    const fighter = {
      url: fighterUrl,
      name: cleanedName,
      nickname: cleanText($('.nick-name__name').text()),
      
      // Rankings
      ufcRanking: null,
      pfpRanking: null,
      
      // Record
      wins: null,
      losses: null,
      draws: null,
      noContests: null,
      
      // Physical Stats
      age: null,
      height: null,
      heightCm: null,
      weight: null,
      weightKg: null,
      reach: null,
      reachCm: null,
      legReach: null,
      legReachCm: null,
      
      // Bio
      style: null,
      stance: null,
      born: null,
      country: null,
      
      // Career Stats (ALL fights)
      avgFightTime: null,
      firstRoundFinishes: null,
      
      // UFC-specific Stats
      avgFightTimeUFC: null,
      ufcBoutsForStats: null,
      
      // Striking Stats
      sigStrikesLandedPerMin: null,
      sigStrikesAbsorbedPerMin: null,
      strikingAccuracy: null,
      sigStrikeDefense: null,
      sigStrikesLanded: null,
      sigStrikesAttempted: null,
      knockdownAvg: null,
      
      // Total Striking (all strikes, not just significant)
      totalStrikesLanded: null,
      totalStrikesAttempted: null,
      totalStrikingAccuracy: null,
      
      // Grappling Stats
      takedownsPerBout: null,
      takedownAccuracy: null,
      takedownDefense: null,
      takedownsLanded: null,
      takedownsAttempted: null,
      submissionsAvg: null,
      
      // Position Stats
      standingCount: null,
      standingPercent: null,
      clinchCount: null,
      clinchPercent: null,
      groundCount: null,
      groundPercent: null,
      
      // Strike Target Stats
      headCount: null,
      headPercent: null,
      bodyCount: null,
      bodyPercent: null,
      legCount: null,
      legPercent: null,
      
      // Win Methods
      winsKO: null,
      winsSub: null,
      winsDec: null,
      winMethodKOPercent: null,
      winMethodSubPercent: null,
      winMethodDecPercent: null,
      
      // Promotion Stats
      promotionStats: []
    };
    
    // Parse Rankings
    $('.rating-fighter-box').each((i, el) => {
      const text = cleanText($(el).text());
      if (text.includes('UFC')) {
        const match = text.match(/#(\d+)/);
        if (match) fighter.ufcRanking = match[1];
      }
    });
    
    // Parse Record from "data-list__item--counts"
    const recordText = cleanText($('.data-list__item--counts .counts').text());
    const record = parseRecord(recordText);
    fighter.wins = record.wins;
    fighter.losses = record.losses;
    fighter.draws = record.draws;
    
    // Parse Physical Stats from data-list
    $('.data-list__item').each((i, el) => {
      const label = cleanText($(el).text()).toLowerCase();
      const value = cleanText($(el).find('.value').text());
      const metric = cleanText($(el).find('.metric').text());
      
      if (label.includes('age')) {
        fighter.age = parseInt(value) || null;
      } else if (label.includes('height')) {
        fighter.height = value;
        fighter.heightCm = metric.replace('cm', '').trim();
      } else if (label.includes('weigh-in')) {
        fighter.weight = value;
        fighter.weightKg = metric.replace('kg', '').trim();
      } else if (label.includes('reach') && !label.includes('leg')) {
        fighter.reach = value;
        fighter.reachCm = metric.replace('cm', '').trim();
      } else if (label.includes('leg reach')) {
        fighter.legReach = value;
        fighter.legReachCm = metric.replace('cm', '').trim();
      }
    });
    
    // Parse Style and Stance
    $('.data-list__item--new-style').each((i, el) => {
      const label = cleanText($(el).text()).toLowerCase();
      const value = cleanText($(el).find('.new-style').text());
      
      if (label.includes('style')) {
        fighter.style = value;
      } else if (label.includes('stance')) {
        fighter.stance = value;
      } else if (label.includes('born')) {
        fighter.born = value;
      }
    });
    
    // Country
    fighter.country = cleanText($('.data-list__item--country').text());
    
    // 🔥 Parse Statistics Section
    $('.stats-list__item').each((i, el) => {
      const $item = $(el);
      
      const leftText = cleanText($item.find('.left-block .text').text()).toLowerCase();
      const leftNumberRaw = cleanText($item.find('.left-block .number').first().text());
      const leftNumber = fixDuplicateNumber(leftNumberRaw);
      
      const rightText = cleanText($item.find('.right-block .text').text()).toLowerCase();
      const rightNumberRaw = cleanText($item.find('.right-block .number').first().text());
      const rightNumber = fixDuplicateNumber(rightNumberRaw);
      
      // Avg fight time (ALL fights)
      if (leftText.includes('avg fight time') && !leftText.includes('ufc')) {
        fighter.avgFightTime = cleanTimeFormat(leftNumber);
      }
      // Avg fight time in UFC
      else if (leftText.includes('avg fight time') && leftText.includes('ufc')) {
        fighter.avgFightTimeUFC = cleanTimeFormat(leftNumber);
      }
      // UFC Bouts for calculating statistics
      else if (rightText.includes('ufc bouts for calculating')) {
        fighter.ufcBoutsForStats = parseInt(rightNumber) || null;
      }
      // First round finishes
      else if (rightText.includes('first round')) {
        fighter.firstRoundFinishes = parseInt(rightNumber) || null;
      }
      // Takedowns per bout
      else if (leftText.includes('takedowns per bout')) {
        fighter.takedownsPerBout = parseFloat(leftNumber) || null;
      }
      // Takedowns Landed
      else if (rightText.includes('takedowns landed')) {
        fighter.takedownsLanded = parseInt(rightNumber) || null;
      }
      else if (leftText.includes('takedowns landed')) {
        fighter.takedownsLanded = parseInt(leftNumber) || null;
      }
      // Takedown Attempted
      else if (rightText.includes('takedown attempted')) {
        fighter.takedownsAttempted = parseInt(rightNumber) || null;
      }
      else if (leftText.includes('takedown attempted')) {
        fighter.takedownsAttempted = parseInt(leftNumber) || null;
      }
      // Successful takedown (Accuracy)
      else if (rightText.includes('successful takedown')) {
        fighter.takedownAccuracy = cleanPercentage(rightNumber);
      }
      else if (leftText.includes('successful takedown')) {
        fighter.takedownAccuracy = cleanPercentage(leftNumber);
      }
      // Takedown Defense
      else if (leftText.includes('takedown defense')) {
        fighter.takedownDefense = cleanPercentage(leftNumber);
      }
      else if (rightText.includes('takedown defense')) {
        fighter.takedownDefense = cleanPercentage(rightNumber);
      }
      // Sig. strikes landed (per min)
      else if (rightText.includes('sig. strikes landed') && rightText.includes('per min')) {
        fighter.sigStrikesLandedPerMin = parseFloat(rightNumber) || null;
      }
      else if (leftText.includes('sig. strikes landed') && leftText.includes('per min')) {
        fighter.sigStrikesLandedPerMin = parseFloat(leftNumber) || null;
      }
      // Sig. strikes absorbed (per min)
      else if (leftText.includes('sig. strikes absorbed')) {
        fighter.sigStrikesAbsorbedPerMin = parseFloat(leftNumber) || null;
      }
      else if (rightText.includes('sig. strikes absorbed')) {
        fighter.sigStrikesAbsorbedPerMin = parseFloat(rightNumber) || null;
      }
      // Sig. Strikes Landed (total)
      else if (rightText.includes('sig. strikes landed') && !rightText.includes('per')) {
        fighter.sigStrikesLanded = parseInt(rightNumber) || null;
      }
      else if (leftText.includes('sig. strikes landed') && !leftText.includes('per')) {
        fighter.sigStrikesLanded = parseInt(leftNumber) || null;
      }
      // Sig. Strikes Attempted
      else if (leftText.includes('sig. strikes attempted')) {
        fighter.sigStrikesAttempted = parseInt(leftNumber) || null;
      }
      else if (rightText.includes('sig. strikes attempted')) {
        fighter.sigStrikesAttempted = parseInt(rightNumber) || null;
      }
      // Striking Accuracy
      else if (rightText.includes('striking accuracy')) {
        fighter.totalStrikingAccuracy = cleanPercentage(rightNumber);
      }
      else if (rightText.includes('significant strikes accuracy')) {
        fighter.strikingAccuracy = cleanPercentage(rightNumber);
      }
      else if (leftText.includes('significant strikes accuracy')) {
        fighter.strikingAccuracy = cleanPercentage(leftNumber);
      }
      // Sig. strikes defense
      else if (leftText.includes('sig. strikes defense')) {
        fighter.sigStrikeDefense = cleanPercentage(leftNumber);
      }
      else if (rightText.includes('sig. strikes defense')) {
        fighter.sigStrikeDefense = cleanPercentage(rightNumber);
      }
      // Avg. knockdowns
      else if (rightText.includes('knockdown')) {
        fighter.knockdownAvg = parseFloat(rightNumber) || null;
      }
      else if (leftText.includes('knockdown')) {
        fighter.knockdownAvg = parseFloat(leftNumber) || null;
      }
    });
    
    // 🔥 Parse Promotion Stats (table)
    $('.promotion-stats table tbody tr').each((i, el) => {
      const promotion = cleanText($(el).find('td').eq(0).text());
      const bouts = parseInt(cleanText($(el).find('td').eq(1).text())) || 0;
      
      if (promotion && bouts > 0) {
        fighter.promotionStats.push({
          promotion: promotion,
          bouts: bouts
        });
      }
    });
    
    // 🔥 Parse Position Stats (Sig. strikes by position)
    $('.punch-list__item').each((i, el) => {
      const label = cleanText($(el).find('.punch-list__text').text()).toLowerCase();
      const valueText = cleanText($(el).find('.punch-list__text--down').text());
      
      // Parse "272 (70%)"
      const match = valueText.match(/(\d+)\s*\((\d+)%\)/);
      if (!match) return;
      
      const count = parseInt(match[1]) || 0;
      const percent = match[2] + '%';
      
      if (label.includes('standing')) {
        fighter.standingCount = count;
        fighter.standingPercent = percent;
      } else if (label.includes('clinch')) {
        fighter.clinchCount = count;
        fighter.clinchPercent = percent;
      } else if (label.includes('ground')) {
        fighter.groundCount = count;
        fighter.groundPercent = percent;
      }
    });
    
    // 🔥 Parse Strike Target Stats (Body diagram)
    $('.center-block .target-block').each((i, el) => {
      const target = cleanText($(el).find('.target').text()).toLowerCase();
      const count = parseInt(cleanText($(el).find('.quantity').text())) || 0;
      const percent = cleanText($(el).find('.percent').text());
      
      if (target.includes('head')) {
        fighter.headCount = count;
        fighter.headPercent = percent;
      } else if (target.includes('body')) {
        fighter.bodyCount = count;
        fighter.bodyPercent = percent;
      } else if (target.includes('legs')) {
        fighter.legCount = count;
        fighter.legPercent = percent;
      }
    });
    
    // 🔥 Parse Win Methods
    let foundWinMethods = false;
    
    // Selector 1
    $('.left-block .wins-list__item').each((i, el) => {
      const label = cleanText($(el).find('.wins-list__text').first().text());
      const value = cleanText($(el).find('.wins-list__text--down').text());
      
      const parsed = parseWinMethod(value);
      if (!parsed) return;
      
      foundWinMethods = true;
      
      if (label.includes('KO') || label.includes('TKO')) {
        fighter.winsKO = parsed.count;
        fighter.winMethodKOPercent = parsed.percent;
      } else if (label.includes('Dec')) {
        fighter.winsDec = parsed.count;
        fighter.winMethodDecPercent = parsed.percent;
      } else if (label.includes('Sub')) {
        fighter.winsSub = parsed.count;
        fighter.winMethodSubPercent = parsed.percent;
      }
    });
    
    // Selector 2: Fallback
    if (!foundWinMethods) {
      const winMethodsData = [];
      
      $('.wins-list__text').each((i, el) => {
        const $parent = $(el).parent();
        const label = cleanText($(el).text());
        const value = cleanText($parent.find('.wins-list__text--down').text());
        
        if (label && value) {
          winMethodsData.push({ label, value });
        }
      });
      
      winMethodsData.forEach(item => {
        const parsed = parseWinMethod(item.value);
        if (!parsed) return;
        
        foundWinMethods = true;
        
        if (item.label.includes('KO') || item.label.includes('TKO')) {
          fighter.winsKO = parsed.count;
          fighter.winMethodKOPercent = parsed.percent;
        } else if (item.label.includes('Dec')) {
          fighter.winsDec = parsed.count;
          fighter.winMethodDecPercent = parsed.percent;
        } else if (item.label.includes('Sub')) {
          fighter.winsSub = parsed.count;
          fighter.winMethodSubPercent = parsed.percent;
        }
      });
    }
    
    console.log(`         ✅ ${fighter.name} - ${fighter.ufcRanking ? `#${fighter.ufcRanking}` : 'NR'} - Leg: ${fighter.legReach}`);
    
    return fighter;
    
  } catch (error) {
    console.error(`         ❌ Error:`, error.message);
    return null;
  }
}

// 🔥 Scrape Fight Comparison Page
async function scrapeFightComparison(fightUrl) {
  console.log(`   🥊 Fight: ${fightUrl.split('/').pop()}`);
  
  try {
    await delay(2000);
    const html = await fetchWithRetry(fightUrl);
    const $ = cheerio.load(html);
    
    const fight = {
      url: fightUrl,
      
      // Event Info
      eventName: cleanText($('.center-block__name').text()),
      eventDate: cleanText($('.center-block__date').text()),
      eventTime: cleanText($('.center-block__time').text()),
      weightClass: cleanText($('.center-block__weight').text()),
      
      // 🔥 NEW: Bout Format (rounds)
      rounds: null, // Just the number: 3 or 5
      boutFormat: null, // Full format: "3x5" or "5x5"
      
      // Fighter 1
      fighter1: {
        name: null,
        url: null,
        ranking: null,
        age: null,
        reach: null,
        reachCm: null,
        height: null,
        heightCm: null,
        legReach: null,
        legReachCm: null,
        lastWeighIn: null,
        lastWeighInKg: null
      },
      
      // Fighter 2
      fighter2: {
        name: null,
        url: null,
        ranking: null,
        age: null,
        reach: null,
        reachCm: null,
        height: null,
        heightCm: null,
        legReach: null,
        legReachCm: null,
        lastWeighIn: null,
        lastWeighInKg: null
      }
    };
    
    // 🔥 Parse Rounds/Bout Format - MIT INVERT FIX!
    const clockText = cleanText($('.center-block__clock').text());
    
    // Extract rounds from "3:30 PM ET • 5 x 5"
    const roundsMatch = clockText.match(/(\d+)\s*x\s*5/i);
    if (roundsMatch) {
      const parsedRounds = parseInt(roundsMatch[1]);
      
      // 🔧 FIX: Die Werte sind vertauscht, also invertieren!
      // Wenn wir 3 lesen, ist es 5. Wenn wir 5 lesen, ist es 3.
      if (parsedRounds === 3) {
        fight.rounds = 5;
        fight.boutFormat = '5x5';
        console.log(`      🔥 Rounds: ${fight.rounds} (${fight.boutFormat}) - inverted from ${parsedRounds}`);
      } else if (parsedRounds === 5) {
        fight.rounds = 3;
        fight.boutFormat = '3x5';
        console.log(`      🔥 Rounds: ${fight.rounds} (${fight.boutFormat}) - inverted from ${parsedRounds}`);
      } else {
        // Fallback wenn es was anderes ist
        fight.rounds = parsedRounds;
        fight.boutFormat = `${parsedRounds}x5`;
        console.log(`      🔥 Rounds: ${fight.rounds} (${fight.boutFormat})`);
      }
    } else {
      console.log(`      ⚠️  No rounds found, defaulting to 3`);
      fight.rounds = 3;
      fight.boutFormat = '3x5';
    }
    
    // Fighter 1 Data
    const fighter1Block = $('.fighter1');
    fight.fighter1.name = cleanText(fighter1Block.find('.name').text());
    const fighter1Href = fighter1Block.find('.name').attr('href');
    if (fighter1Href) {
      fight.fighter1.url = fighter1Href.startsWith('http') ? fighter1Href : BASE_URL + fighter1Href;
    }
    
    const fighter1Ranking = cleanText(fighter1Block.find('.events__fighter-status-box span').last().text());
    if (fighter1Ranking.includes('#')) {
      fight.fighter1.ranking = fighter1Ranking;
    }
    
    fighter1Block.find('.data-list__item').each((i, el) => {
      const label = cleanText($(el).text()).toLowerCase();
      const value = cleanText($(el).find('span').first().text());
      const metric = cleanText($(el).find('.metric').text());
      
      if (label.includes('age')) {
        fight.fighter1.age = parseInt(value) || null;
      } else if (label.includes('reach') && !label.includes('leg')) {
        fight.fighter1.reach = value;
        fight.fighter1.reachCm = metric.replace('cm', '').trim();
      } else if (label.includes('height')) {
        fight.fighter1.height = value;
        fight.fighter1.heightCm = metric.replace('cm', '').trim();
      } else if (label.includes('leg')) {
        fight.fighter1.legReach = value;
        fight.fighter1.legReachCm = metric.replace('cm', '').trim();
      } else if (label.includes('weigh-in')) {
        fight.fighter1.lastWeighIn = value;
        fight.fighter1.lastWeighInKg = metric.replace('kg', '').trim();
      }
    });
    
    // Fighter 2 Data
    const fighter2Block = $('.fighter2');
    fight.fighter2.name = cleanText(fighter2Block.find('.name').text());
    const fighter2Href = fighter2Block.find('.name').attr('href');
    if (fighter2Href) {
      fight.fighter2.url = fighter2Href.startsWith('http') ? fighter2Href : BASE_URL + fighter2Href;
    }
    
    const fighter2Ranking = cleanText(fighter2Block.find('.events__fighter-status-box span').last().text());
    if (fighter2Ranking.includes('#')) {
      fight.fighter2.ranking = fighter2Ranking;
    }
    
    fighter2Block.find('.data-list__item').each((i, el) => {
      const label = cleanText($(el).text()).toLowerCase();
      const value = cleanText($(el).find('span').first().text());
      const metric = cleanText($(el).find('.metric').text());
      
      if (label.includes('age')) {
        fight.fighter2.age = parseInt(value) || null;
      } else if (label.includes('reach') && !label.includes('leg')) {
        fight.fighter2.reach = value;
        fight.fighter2.reachCm = metric.replace('cm', '').trim();
      } else if (label.includes('height')) {
        fight.fighter2.height = value;
        fight.fighter2.heightCm = metric.replace('cm', '').trim();
      } else if (label.includes('leg')) {
        fight.fighter2.legReach = value;
        fight.fighter2.legReachCm = metric.replace('cm', '').trim();
      } else if (label.includes('weigh-in')) {
        fight.fighter2.lastWeighIn = value;
        fight.fighter2.lastWeighInKg = metric.replace('kg', '').trim();
      }
    });
    
    console.log(`      ✅ ${fight.fighter1.name} vs ${fight.fighter2.name} - ${fight.rounds} rounds`);
    
    return fight;
    
  } catch (error) {
    console.error(`      ❌ Error:`, error.message);
    return null;
  }
}

// 🔥 Scrape Event Page
async function scrapeEvent(eventUrl) {
  console.log(`\n📅 Event: ${eventUrl.split('/').pop()}\n`);
  
  try {
    await delay(2000);
    const html = await fetchWithRetry(eventUrl);
    const $ = cheerio.load(html);
    
    const event = {
      url: eventUrl,
      name: cleanText($('.tournament-top__title').text()) || cleanText($('.c-hero__headline').text()),
      date: cleanText($('.tournament-date .date').text()),
      time: cleanText($('.tournament-date .time').text()),
      location: cleanText($('.tournament-date .address').text()),
      
      fights: []
    };
    
    console.log(`   📍 ${event.name}`);
    console.log(`   📅 ${event.date} ${event.time}`);
    console.log(`   🏟️  ${event.location}\n`);
    
    // Get all fight links
    const fightLinks = [];
    $('.other-fights-list__link').each((i, el) => {
      const href = $(el).attr('href');
      if (href && href.includes('_vs_')) {
        const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
        fightLinks.push(fullUrl);
      }
    });
    
    console.log(`   🥊 Found ${fightLinks.length} fights\n`);
    
    // Scrape each fight
    for (const fightUrl of fightLinks) {
      const fight = await scrapeFightComparison(fightUrl);
      if (fight) {
        event.fights.push(fight);
      }
    }
    
    return event;
    
  } catch (error) {
    console.error(`   ❌ Error:`, error.message);
    return null;
  }
}

// 🔥 Main
async function scrapeAllEvents() {
  console.log('🚀 GIDSTATS.COM SCRAPER - FINAL VERSION\n');
  console.log('='.repeat(70) + '\n');
  
  const eventUrls = [
    'https://gidstats.com/events/ufc_fight_night-2560/',
    'https://gidstats.com/events/ufc_323-2567/',
    'https://gidstats.com/events/ufc_fight_night-2561/'
  ];
  
  const allEvents = [];
  const allFighters = new Map();
  
  for (const eventUrl of eventUrls) {
    const event = await scrapeEvent(eventUrl);
    if (event) {
      allEvents.push(event);
      
      for (const fight of event.fights) {
        if (fight.fighter1.url) allFighters.set(fight.fighter1.url, fight.fighter1.name);
        if (fight.fighter2.url) allFighters.set(fight.fighter2.url, fight.fighter2.name);
      }
    }
  }
  
  console.log(`\n\n🔥 Scraping ${allFighters.size} unique fighters...\n`);
  
  const fighters = [];
  let count = 0;
  
  for (const [fighterUrl, fighterName] of allFighters) {
    count++;
    console.log(`   ⚡ ${count}/${allFighters.size}`);
    
    const fighter = await scrapeFighterProfile(fighterUrl);
    if (fighter) {
      fighters.push(fighter);
    }
  }
  
  const output = {
    scrapedAt: new Date().toISOString(),
    source: 'GIDStats.com',
    dataVersion: '300.0-FINAL',
    events: allEvents,
    fighters: fighters,
    stats: {
      totalEvents: allEvents.length,
      totalFights: allEvents.reduce((sum, e) => sum + e.fights.length, 0),
      totalFighters: fighters.length
    }
  };
  
  const outputPath = path.join(OUTPUT_DIR, 'gidstats-final.json');
  await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ SCRAPING COMPLETE!');
  console.log('='.repeat(70));
  console.log(`📅 Events: ${output.stats.totalEvents}`);
  console.log(`🥊 Fights: ${output.stats.totalFights}`);
  console.log(`👤 Fighters: ${output.stats.totalFighters}`);
  console.log(`📁 Output: ${outputPath}`);
  console.log('='.repeat(70) + '\n');
}

scrapeAllEvents().catch(console.error);