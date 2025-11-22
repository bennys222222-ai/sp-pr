const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

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

function parseNumber(text) {
  if (!text) return null;
  const match = text.match(/([\d.]+)/);
  return match ? match[1] : null;
}

function parseHeight(text) {
  if (!text) return null;
  const match = text.match(/(\d+)'\s*(\d+)"/);
  if (!match) return null;
  return (parseInt(match[1]) * 12 + parseInt(match[2])).toString();
}

// 🔥 Scrape Single Fight Matchup Stats
async function scrapeFightMatchup(fightUrl) {
  const fightId = fightUrl.split('#')[1] || 'unknown';
  
  try {
    await delay(2000);
    const html = await fetchWithRetry(fightUrl);
    const $ = cheerio.load(html);
    
    const fight = {
      fightId: fightId,
      url: fightUrl,
      eventName: cleanText($('.c-hero__headline').text()),
      weightClass: null,
      fighter1: {
        name: null,
        record: null,
        country: null,
        height: null,
        heightInches: null,
        weight: null,
        weightLbs: null,
        reach: null,
        reachInches: null,
        legReach: null,
        legReachInches: null,
        stance: null,
        odds: null
      },
      fighter2: {
        name: null,
        record: null,
        country: null,
        height: null,
        heightInches: null,
        weight: null,
        weightLbs: null,
        reach: null,
        reachInches: null,
        legReach: null,
        legReachInches: null,
        stance: null,
        odds: null
      }
    };
    
    // Get weight class
    fight.weightClass = cleanText($('.c-listing-fight__class-text').text());
    
    // Get fighter names
    fight.fighter1.name = cleanText($('.c-listing-fight__corner-name').eq(0).text());
    fight.fighter2.name = cleanText($('.c-listing-fight__corner-name').eq(1).text());
    
    // 🔥 Parse ALL c-stat-compare__group elements
    const statGroups = $('.c-stat-compare__group');
    
    // Process in pairs (left fighter, right fighter)
    for (let i = 0; i < statGroups.length; i += 2) {
      const group1 = statGroups.eq(i);
      const group2 = statGroups.eq(i + 1);
      
      if (!group1.length || !group2.length) continue;
      
      const label1 = cleanText(group1.find('.c-stat-compare__label').text()).toLowerCase();
      const label2 = cleanText(group2.find('.c-stat-compare__label').text()).toLowerCase();
      const label = label1 || label2;
      
      const value1 = cleanText(group1.find('.c-stat-compare__number').text());
      const value2 = cleanText(group2.find('.c-stat-compare__number').text());
      
      // Record
      if (label.includes('record') || label.includes('aufzeichnung')) {
        fight.fighter1.record = value1;
        fight.fighter2.record = value2;
      }
      // Country
      else if (label.includes('country') || label.includes('land')) {
        fight.fighter1.country = value1;
        fight.fighter2.country = value2;
      }
      // Height
      else if (label.includes('height') || label.includes('höhe')) {
        fight.fighter1.height = value1;
        fight.fighter2.height = value2;
        fight.fighter1.heightInches = parseHeight(value1);
        fight.fighter2.heightInches = parseHeight(value2);
      }
      // Weight
      else if (label.includes('weight') || label.includes('gewichtung') || label.includes('gewicht')) {
        fight.fighter1.weight = value1;
        fight.fighter2.weight = value2;
        fight.fighter1.weightLbs = parseNumber(value1);
        fight.fighter2.weightLbs = parseNumber(value2);
      }
      // Reach (not leg reach)
      else if ((label.includes('reach') || label.includes('erreichen')) && !label.includes('leg') && !label.includes('bein')) {
        fight.fighter1.reach = value1;
        fight.fighter2.reach = value2;
        fight.fighter1.reachInches = parseNumber(value1);
        fight.fighter2.reachInches = parseNumber(value2);
      }
      // 🔥 LEG REACH
      else if (label.includes('leg reach') || (label.includes('bein') && label.includes('reach'))) {
        fight.fighter1.legReach = value1;
        fight.fighter2.legReach = value2;
        fight.fighter1.legReachInches = parseNumber(value1);
        fight.fighter2.legReachInches = parseNumber(value2);
      }
      // Stance
      else if (label.includes('stance') || label.includes('haltung')) {
        fight.fighter1.stance = value1;
        fight.fighter2.stance = value2;
      }
      // Odds
      else if (label.includes('odds') || label.includes('chancen')) {
        fight.fighter1.odds = value1;
        fight.fighter2.odds = value2;
      }
    }
    
    console.log(`      ✅ ${fight.fighter1.name} vs ${fight.fighter2.name}`);
    console.log(`         Leg Reach: ${fight.fighter1.legReach || 'N/A'} vs ${fight.fighter2.legReach || 'N/A'}`);
    
    return fight;
    
  } catch (error) {
    console.error(`      ❌ Error #${fightId}:`, error.message);
    return null;
  }
}

// 🔥 Main
async function scrapeFightLinks() {
  console.log('🚀 UFC.COM FIGHT SCRAPER - 37 FIGHTS\n');
  console.log('='.repeat(70) + '\n');
  
  // 🔥 ALLE DEINE FIGHT LINKS
  const fightLinks = [
    // UFC Fight Night: Tsarukyan vs Hooker (14 fights)
    'https://www.ufc.com/event/ufc-fight-night-november-22-2025#12452',
    'https://www.ufc.com/event/ufc-fight-night-november-22-2025#12453',
    'https://www.ufc.com/event/ufc-fight-night-november-22-2025#12460',
    'https://www.ufc.com/event/ufc-fight-night-november-22-2025#12474',
    'https://www.ufc.com/event/ufc-fight-night-november-22-2025#12464',
    'https://www.ufc.com/event/ufc-fight-night-november-22-2025#12463',
    'https://www.ufc.com/event/ufc-fight-night-november-22-2025#12468',
    'https://www.ufc.com/event/ufc-fight-night-november-22-2025#12466',
    'https://www.ufc.com/event/ufc-fight-night-november-22-2025#12515',
    'https://www.ufc.com/event/ufc-fight-night-november-22-2025#12465',
    'https://www.ufc.com/event/ufc-fight-night-november-22-2025#12462',
    'https://www.ufc.com/event/ufc-fight-night-november-22-2025#12467',
    'https://www.ufc.com/event/ufc-fight-night-november-22-2025#12514',
    'https://www.ufc.com/event/ufc-fight-night-november-22-2025#12516',
    
    // UFC 323: Merab vs Petr Yan (14 fights)
    'https://www.ufc.com/event/ufc-323#12482',
    'https://www.ufc.com/event/ufc-323#12483',
    'https://www.ufc.com/event/ufc-323#12486',
    'https://www.ufc.com/event/ufc-323#12484',
    'https://www.ufc.com/event/ufc-323#12485',
    'https://www.ufc.com/event/ufc-323#12495',
    'https://www.ufc.com/event/ufc-323#12498',
    'https://www.ufc.com/event/ufc-323#12525',
    'https://www.ufc.com/event/ufc-323#12487',
    'https://www.ufc.com/event/ufc-323#12493',
    'https://www.ufc.com/event/ufc-323#12494',
    'https://www.ufc.com/event/ufc-323#12496',
    'https://www.ufc.com/event/ufc-323#12497',
    'https://www.ufc.com/event/ufc-323#12499',
    
    // UFC Fight Night: Royval vs Kape (9 fights)
    'https://www.ufc.com/event/ufc-fight-night-december-13-2025#12469',
    'https://www.ufc.com/event/ufc-fight-night-december-13-2025#12518',
    'https://www.ufc.com/event/ufc-fight-night-december-13-2025#12519',
    'https://www.ufc.com/event/ufc-fight-night-december-13-2025#12520',
    'https://www.ufc.com/event/ufc-fight-night-december-13-2025#12511',
    'https://www.ufc.com/event/ufc-fight-night-december-13-2025#12521',
    'https://www.ufc.com/event/ufc-fight-night-december-13-2025#12522',
    'https://www.ufc.com/event/ufc-fight-night-december-13-2025#12512',
    'https://www.ufc.com/event/ufc-fight-night-december-13-2025#12510'
  ];
  
  console.log(`📋 Processing ${fightLinks.length} fights from 3 events\n`);
  
  const fights = [];
  let successCount = 0;
  
  for (let i = 0; i < fightLinks.length; i++) {
    console.log(`\n   ⚡ Fight ${i + 1}/${fightLinks.length} - ID: ${fightLinks[i].split('#')[1]}`);
    
    const fight = await scrapeFightMatchup(fightLinks[i]);
    if (fight && fight.fighter1.name && fight.fighter2.name) {
      fights.push(fight);
      successCount++;
    }
  }
  
  // Save results
  const output = {
    scrapedAt: new Date().toISOString(),
    source: 'UFC.com Fight Matchups',
    dataVersion: '15.0',
    totalFights: fights.length,
    events: [
      { name: 'UFC Fight Night: Tsarukyan vs Hooker', fights: fights.filter(f => f.url.includes('november-22')).length },
      { name: 'UFC 323: Merab vs Petr Yan', fights: fights.filter(f => f.url.includes('ufc-323')).length },
      { name: 'UFC Fight Night: Royval vs Kape', fights: fights.filter(f => f.url.includes('december-13')).length }
    ],
    fights: fights
  };
  
  const outputPath = path.join(OUTPUT_DIR, 'ufc-fight-matchups.json');
  await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ SCRAPING COMPLETE!');
  console.log('='.repeat(70));
  console.log(`📊 Successfully scraped: ${successCount}/${fightLinks.length} fights`);
  console.log(`📁 Saved to: ${outputPath}`);
  console.log('='.repeat(70) + '\n');
  
  // Print summary by event
  console.log('📋 SUMMARY BY EVENT:\n');
  
  const event1Fights = fights.filter(f => f.url.includes('november-22'));
  console.log(`🎯 UFC Fight Night: Tsarukyan vs Hooker (${event1Fights.length} fights)`);
  event1Fights.forEach((f, i) => {
    console.log(`   ${i + 1}. ${f.fighter1.name} vs ${f.fighter2.name} - Leg: ${f.fighter1.legReach || 'N/A'} vs ${f.fighter2.legReach || 'N/A'}`);
  });
  
  const event2Fights = fights.filter(f => f.url.includes('ufc-323'));
  console.log(`\n🎯 UFC 323: Merab vs Petr Yan (${event2Fights.length} fights)`);
  event2Fights.forEach((f, i) => {
    console.log(`   ${i + 1}. ${f.fighter1.name} vs ${f.fighter2.name} - Leg: ${f.fighter1.legReach || 'N/A'} vs ${f.fighter2.legReach || 'N/A'}`);
  });
  
  const event3Fights = fights.filter(f => f.url.includes('december-13'));
  console.log(`\n🎯 UFC Fight Night: Royval vs Kape (${event3Fights.length} fights)`);
  event3Fights.forEach((f, i) => {
    console.log(`   ${i + 1}. ${f.fighter1.name} vs ${f.fighter2.name} - Leg: ${f.fighter1.legReach || 'N/A'} vs ${f.fighter2.legReach || 'N/A'}`);
  });
}

scrapeFightLinks().catch(console.error);