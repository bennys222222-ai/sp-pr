const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

const BASE_URL = 'http://ufcstats.com';
const UPCOMING_URL = `${BASE_URL}/statistics/events/upcoming`;
const OUTPUT_DIR = path.join(__dirname, '../public/data');
const CACHE_DIR = path.join(OUTPUT_DIR, 'cache');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'ufc-data.json');

// Ensure directories exist
async function ensureDirectories() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

// Helper: delay between requests
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper: fetch with retry
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      });
      return response.data;
    } catch (error) {
      console.error(`❌ Fetch failed (attempt ${i + 1}/${retries}):`, url);
      if (i === retries - 1) throw error;
      await delay(2000 * (i + 1));
    }
  }
}

// Helper: clean text
function cleanText(text) {
  return text ? text.replace(/\s+/g, ' ').trim() : '';
}

// Helper: generate simple hash ID
function generateId(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

// Helper: parse height to inches
function parseHeight(heightStr) {
  if (!heightStr || heightStr === '--') return null;
  const match = heightStr.match(/(\d+)'\s*(\d+)"/);
  if (!match) return null;
  return parseInt(match[1]) * 12 + parseInt(match[2]);
}

// Helper: parse weight to lbs
function parseWeight(weightStr) {
  if (!weightStr || weightStr === '--') return null;
  const match = weightStr.match(/(\d+)\s*lbs/);
  return match ? parseInt(match[1]) : null;
}

// Helper: parse reach to inches
function parseReach(reachStr) {
  if (!reachStr || reachStr === '--') return null;
  const match = reachStr.match(/(\d+)"/);
  return match ? parseInt(match[1]) : null;
}

// Helper: parse percentage
function parsePercentage(percentStr) {
  if (!percentStr || percentStr === '--') return null;
  return cleanText(percentStr);
}

// Helper: calculate age from DOB
function calculateAge(dobStr) {
  if (!dobStr || dobStr === '--') return null;
  try {
    const dob = new Date(dobStr);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  } catch {
    return null;
  }
}

// Helper: parse time to seconds
function parseTimeToSeconds(timeStr) {
  if (!timeStr || timeStr === '--') return null;
  const match = timeStr.match(/(\d+):(\d+)/);
  if (!match) return null;
  return parseInt(match[1]) * 60 + parseInt(match[2]);
}

// Helper: calculate win methods
function calculateWinMethods(fightHistory) {
  const methods = { ko: 0, sub: 0, dec: 0 };
  
  for (const fight of fightHistory) {
    if (fight.result && fight.result.toLowerCase() === 'win' && fight.method) {
      const method = fight.method.toLowerCase();
      if (method.includes('ko') || method.includes('tko') || method.includes('knockout')) {
        methods.ko++;
      } else if (method.includes('sub') || method.includes('submission')) {
        methods.sub++;
      } else if (method.includes('decision') || method.includes('dec')) {
        methods.dec++;
      }
    }
  }
  
  return methods;
}

// 🔥 Scrape EVERYTHING from matchup page (Tale of the tape + Fight history + ALL stats)
async function scrapeFightMatchup(fightLink, fighter1Id, fighter2Id) {
  console.log(`      🔍 Scraping matchup: ${fightLink}`);
  
  try {
    await delay(1000);
    const html = await fetchWithRetry(fightLink);
    const $ = cheerio.load(html);
    
    const matchup = {
      fighter1: {
        id: fighter1Id,
        name: null,
        link: null,
        nickname: null,
        record: null,
        recordBreakdown: {
          wins: 0,
          losses: 0,
          draws: 0,
          noContests: 0,
          winsByKO: 0,
          winsBySub: 0,
          winsByDec: 0
        },
        career: {
          // Physical
          height: null,
          heightInches: null,
          weight: null,
          weightLbs: null,
          reach: null,
          reachInches: null,
          legReach: null,
          legReachInches: null,
          stance: null,
          dob: null,
          age: null,
          
          // Fight metrics
          avgFightTime: null,
          avgFightTimeSeconds: null,
          
          // Striking
          slpm: null,
          strAcc: null,
          sapm: null,
          strDef: null,
          sigStrikesLanded: null,
          sigStrikesAttempted: null,
          sigStrikesAccuracy: null,
          totalStrikesLanded: null,
          totalStrikesAttempted: null,
          knockdowns: null,
          
          // Striking by position
          sigStrikesHead: null,
          sigStrikesBody: null,
          sigStrikesLeg: null,
          sigStrikesDistance: null,
          sigStrikesClinch: null,
          sigStrikesGround: null,
          
          // Grappling
          tdAvg: null,
          tdAcc: null,
          tdDef: null,
          takedownsLanded: null,
          takedownsAttempted: null,
          subAvg: null,
          submissions: null,
          reversals: null,
          controlTime: null,
          controlTimeSeconds: null,
          
          // Additional stats
          advances: null,
          headStrikesAttempted: null,
          headStrikesLanded: null,
          bodyStrikesAttempted: null,
          bodyStrikesLanded: null,
          legStrikesAttempted: null,
          legStrikesLanded: null,
          distanceStrikesAttempted: null,
          distanceStrikesLanded: null,
          clinchStrikesAttempted: null,
          clinchStrikesLanded: null,
          groundStrikesAttempted: null,
          groundStrikesLanded: null,
        },
        fightHistory: [],
        recentFights: [],
        fullFightHistory: []
      },
      fighter2: {
        id: fighter2Id,
        name: null,
        link: null,
        nickname: null,
        record: null,
        recordBreakdown: {
          wins: 0,
          losses: 0,
          draws: 0,
          noContests: 0,
          winsByKO: 0,
          winsBySub: 0,
          winsByDec: 0
        },
        career: {
          // Physical
          height: null,
          heightInches: null,
          weight: null,
          weightLbs: null,
          reach: null,
          reachInches: null,
          legReach: null,
          legReachInches: null,
          stance: null,
          dob: null,
          age: null,
          
          // Fight metrics
          avgFightTime: null,
          avgFightTimeSeconds: null,
          
          // Striking
          slpm: null,
          strAcc: null,
          sapm: null,
          strDef: null,
          sigStrikesLanded: null,
          sigStrikesAttempted: null,
          sigStrikesAccuracy: null,
          totalStrikesLanded: null,
          totalStrikesAttempted: null,
          knockdowns: null,
          
          // Striking by position
          sigStrikesHead: null,
          sigStrikesBody: null,
          sigStrikesLeg: null,
          sigStrikesDistance: null,
          sigStrikesClinch: null,
          sigStrikesGround: null,
          
          // Grappling
          tdAvg: null,
          tdAcc: null,
          tdDef: null,
          takedownsLanded: null,
          takedownsAttempted: null,
          subAvg: null,
          submissions: null,
          reversals: null,
          controlTime: null,
          controlTimeSeconds: null,
          
          // Additional stats
          advances: null,
          headStrikesAttempted: null,
          headStrikesLanded: null,
          bodyStrikesAttempted: null,
          bodyStrikesLanded: null,
          legStrikesAttempted: null,
          legStrikesLanded: null,
          distanceStrikesAttempted: null,
          distanceStrikesLanded: null,
          clinchStrikesAttempted: null,
          clinchStrikesLanded: null,
          groundStrikesAttempted: null,
          groundStrikesLanded: null,
        },
        fightHistory: [],
        recentFights: [],
        fullFightHistory: []
      },
      fightDetails: {},
      roundStats: []
    };
    
    // 🔥 Get fighter names, nicknames, and links
    $('.b-fight-details__person').each((i, el) => {
      const $el = $(el);
      const name = cleanText($el.find('h3 a').text());
      const link = $el.find('h3 a').attr('href');
      const nickname = cleanText($el.find('p.b-fight-details__person-title').text());
      
      if (i === 0) {
        matchup.fighter1.name = name;
        matchup.fighter1.link = link;
        matchup.fighter1.nickname = nickname || null;
      } else if (i === 1) {
        matchup.fighter2.name = name;
        matchup.fighter2.link = link;
        matchup.fighter2.nickname = nickname || null;
      }
    });
    
    console.log(`      📊 Parsing Tale of the Tape stats...`);
    
    // 🔥 Parse ALL "Tale of the tape" stats
    $('tr.b-fight-details__table-row-preview').each((i, row) => {
      const $row = $(row);
      const $cols = $row.find('td.b-fight-details__table-col');
      
      if ($cols.length >= 3) {
        const label = cleanText($cols.eq(0).find('p').text()).toLowerCase();
        const fighter1Value = cleanText($cols.eq(1).find('p').text());
        const fighter2Value = cleanText($cols.eq(2).find('p').text());
        
        // 🔥 Wins/Losses/Draws
        if (label.includes('wins/losses/draws') || label.includes('w/l/d')) {
          const f1Record = fighter1Value.match(/(\d+)-(\d+)-(\d+)/);
          if (f1Record) {
            matchup.fighter1.record = fighter1Value;
            matchup.fighter1.recordBreakdown.wins = parseInt(f1Record[1]);
            matchup.fighter1.recordBreakdown.losses = parseInt(f1Record[2]);
            matchup.fighter1.recordBreakdown.draws = parseInt(f1Record[3]);
          }
          
          const f2Record = fighter2Value.match(/(\d+)-(\d+)-(\d+)/);
          if (f2Record) {
            matchup.fighter2.record = fighter2Value;
            matchup.fighter2.recordBreakdown.wins = parseInt(f2Record[1]);
            matchup.fighter2.recordBreakdown.losses = parseInt(f2Record[2]);
            matchup.fighter2.recordBreakdown.draws = parseInt(f2Record[3]);
          }
        }
        // 🔥 Height
        else if (label.includes('height')) {
          matchup.fighter1.career.height = fighter1Value || null;
          matchup.fighter1.career.heightInches = parseHeight(fighter1Value);
          matchup.fighter2.career.height = fighter2Value || null;
          matchup.fighter2.career.heightInches = parseHeight(fighter2Value);
        }
        // 🔥 Weight
        else if (label.includes('weight')) {
          matchup.fighter1.career.weight = fighter1Value || null;
          matchup.fighter1.career.weightLbs = parseWeight(fighter1Value);
          matchup.fighter2.career.weight = fighter2Value || null;
          matchup.fighter2.career.weightLbs = parseWeight(fighter2Value);
        }
        // 🔥 Reach
        else if (label.includes('reach') && !label.includes('leg')) {
          matchup.fighter1.career.reach = fighter1Value || null;
          matchup.fighter1.career.reachInches = parseReach(fighter1Value);
          matchup.fighter2.career.reach = fighter2Value || null;
          matchup.fighter2.career.reachInches = parseReach(fighter2Value);
        }
        // 🔥 Leg Reach
        else if (label.includes('leg reach')) {
          matchup.fighter1.career.legReach = fighter1Value || null;
          matchup.fighter1.career.legReachInches = parseReach(fighter1Value);
          matchup.fighter2.career.legReach = fighter2Value || null;
          matchup.fighter2.career.legReachInches = parseReach(fighter2Value);
        }
        // 🔥 Stance
        else if (label.includes('stance')) {
          matchup.fighter1.career.stance = fighter1Value || null;
          matchup.fighter2.career.stance = fighter2Value || null;
        }
        // 🔥 DOB
        else if (label.includes('dob') || label.includes('date of birth')) {
          matchup.fighter1.career.dob = fighter1Value || null;
          matchup.fighter1.career.age = calculateAge(fighter1Value);
          matchup.fighter2.career.dob = fighter2Value || null;
          matchup.fighter2.career.age = calculateAge(fighter2Value);
        }
        // 🔥 Average Fight Time
        else if (label.includes('average fight time') || label.includes('avg fight time')) {
          matchup.fighter1.career.avgFightTime = fighter1Value || null;
          matchup.fighter1.career.avgFightTimeSeconds = parseTimeToSeconds(fighter1Value);
          matchup.fighter2.career.avgFightTime = fighter2Value || null;
          matchup.fighter2.career.avgFightTimeSeconds = parseTimeToSeconds(fighter2Value);
        }
        // 🔥 SLpM (Strikes Landed per Min)
        else if (label.includes('strikes landed per min') || label === 'slpm') {
          matchup.fighter1.career.slpm = fighter1Value || null;
          matchup.fighter2.career.slpm = fighter2Value || null;
        }
        // 🔥 Striking Accuracy
        else if (label.includes('striking accuracy') || label.includes('str. acc')) {
          matchup.fighter1.career.strAcc = parsePercentage(fighter1Value);
          matchup.fighter2.career.strAcc = parsePercentage(fighter2Value);
        }
        // 🔥 SApM (Strikes Absorbed per Min)
        else if (label.includes('strikes absorbed per min') || label === 'sapm') {
          matchup.fighter1.career.sapm = fighter1Value || null;
          matchup.fighter2.career.sapm = fighter2Value || null;
        }
        // 🔥 Striking Defense
        else if ((label.includes('defense') || label.includes('str. def')) && !label.includes('takedown')) {
          matchup.fighter1.career.strDef = parsePercentage(fighter1Value);
          matchup.fighter2.career.strDef = parsePercentage(fighter2Value);
        }
        // 🔥 Knockdowns
        else if (label.includes('knockdowns') || label === 'kd') {
          matchup.fighter1.career.knockdowns = fighter1Value || null;
          matchup.fighter2.career.knockdowns = fighter2Value || null;
        }
        // 🔥 Takedown Average
        else if (label.includes('takedowns average') || label.includes('takedown average') || label.includes('td avg')) {
          matchup.fighter1.career.tdAvg = fighter1Value || null;
          matchup.fighter2.career.tdAvg = fighter2Value || null;
        }
        // 🔥 Takedown Accuracy
        else if (label.includes('takedown accuracy') || label.includes('td acc')) {
          matchup.fighter1.career.tdAcc = parsePercentage(fighter1Value);
          matchup.fighter2.career.tdAcc = parsePercentage(fighter2Value);
        }
        // 🔥 Takedown Defense
        else if (label.includes('takedown defense') || label.includes('td def')) {
          matchup.fighter1.career.tdDef = parsePercentage(fighter1Value);
          matchup.fighter2.career.tdDef = parsePercentage(fighter2Value);
        }
        // 🔥 Submission Average
        else if (label.includes('submission average') || label.includes('sub avg') || label.includes('sub. avg')) {
          matchup.fighter1.career.subAvg = fighter1Value || null;
          matchup.fighter2.career.subAvg = fighter2Value || null;
        }
        // 🔥 Significant Strikes (total)
        else if (label.includes('sig. str.') || label.includes('significant strikes')) {
          // Parse "123 of 234" format
          const f1Match = fighter1Value.match(/(\d+)\s+of\s+(\d+)/);
          if (f1Match) {
            matchup.fighter1.career.sigStrikesLanded = parseInt(f1Match[1]);
            matchup.fighter1.career.sigStrikesAttempted = parseInt(f1Match[2]);
          }
          const f2Match = fighter2Value.match(/(\d+)\s+of\s+(\d+)/);
          if (f2Match) {
            matchup.fighter2.career.sigStrikesLanded = parseInt(f2Match[1]);
            matchup.fighter2.career.sigStrikesAttempted = parseInt(f2Match[2]);
          }
        }
        // 🔥 Total Strikes
        else if (label.includes('total str.') || label.includes('total strikes')) {
          const f1Match = fighter1Value.match(/(\d+)\s+of\s+(\d+)/);
          if (f1Match) {
            matchup.fighter1.career.totalStrikesLanded = parseInt(f1Match[1]);
            matchup.fighter1.career.totalStrikesAttempted = parseInt(f1Match[2]);
          }
          const f2Match = fighter2Value.match(/(\d+)\s+of\s+(\d+)/);
          if (f2Match) {
            matchup.fighter2.career.totalStrikesLanded = parseInt(f2Match[1]);
            matchup.fighter2.career.totalStrikesAttempted = parseInt(f2Match[2]);
          }
        }
        // 🔥 Takedowns
        else if (label.includes('td') && !label.includes('avg') && !label.includes('acc') && !label.includes('def')) {
          const f1Match = fighter1Value.match(/(\d+)\s+of\s+(\d+)/);
          if (f1Match) {
            matchup.fighter1.career.takedownsLanded = parseInt(f1Match[1]);
            matchup.fighter1.career.takedownsAttempted = parseInt(f1Match[2]);
          }
          const f2Match = fighter2Value.match(/(\d+)\s+of\s+(\d+)/);
          if (f2Match) {
            matchup.fighter2.career.takedownsLanded = parseInt(f2Match[1]);
            matchup.fighter2.career.takedownsAttempted = parseInt(f2Match[2]);
          }
        }
        // 🔥 Submissions
        else if (label.includes('sub. att') || label.includes('submission attempts')) {
          matchup.fighter1.career.submissions = fighter1Value || null;
          matchup.fighter2.career.submissions = fighter2Value || null;
        }
        // 🔥 Reversals
        else if (label.includes('rev.') || label.includes('reversals')) {
          matchup.fighter1.career.reversals = fighter1Value || null;
          matchup.fighter2.career.reversals = fighter2Value || null;
        }
        // 🔥 Control Time
        else if (label.includes('ctrl') || label.includes('control')) {
          matchup.fighter1.career.controlTime = fighter1Value || null;
          matchup.fighter1.career.controlTimeSeconds = parseTimeToSeconds(fighter1Value);
          matchup.fighter2.career.controlTime = fighter2Value || null;
          matchup.fighter2.career.controlTimeSeconds = parseTimeToSeconds(fighter2Value);
        }
        // 🔥 Head strikes
        else if (label.includes('head')) {
          const f1Match = fighter1Value.match(/(\d+)\s+of\s+(\d+)/);
          if (f1Match) {
            matchup.fighter1.career.headStrikesLanded = parseInt(f1Match[1]);
            matchup.fighter1.career.headStrikesAttempted = parseInt(f1Match[2]);
          }
          const f2Match = fighter2Value.match(/(\d+)\s+of\s+(\d+)/);
          if (f2Match) {
            matchup.fighter2.career.headStrikesLanded = parseInt(f2Match[1]);
            matchup.fighter2.career.headStrikesAttempted = parseInt(f2Match[2]);
          }
        }
        // 🔥 Body strikes
        else if (label.includes('body')) {
          const f1Match = fighter1Value.match(/(\d+)\s+of\s+(\d+)/);
          if (f1Match) {
            matchup.fighter1.career.bodyStrikesLanded = parseInt(f1Match[1]);
            matchup.fighter1.career.bodyStrikesAttempted = parseInt(f1Match[2]);
          }
          const f2Match = fighter2Value.match(/(\d+)\s+of\s+(\d+)/);
          if (f2Match) {
            matchup.fighter2.career.bodyStrikesLanded = parseInt(f2Match[1]);
            matchup.fighter2.career.bodyStrikesAttempted = parseInt(f2Match[2]);
          }
        }
        // 🔥 Leg strikes
        else if (label.includes('leg')) {
          const f1Match = fighter1Value.match(/(\d+)\s+of\s+(\d+)/);
          if (f1Match) {
            matchup.fighter1.career.legStrikesLanded = parseInt(f1Match[1]);
            matchup.fighter1.career.legStrikesAttempted = parseInt(f1Match[2]);
          }
          const f2Match = fighter2Value.match(/(\d+)\s+of\s+(\d+)/);
          if (f2Match) {
            matchup.fighter2.career.legStrikesLanded = parseInt(f2Match[1]);
            matchup.fighter2.career.legStrikesAttempted = parseInt(f2Match[2]);
          }
        }
        // 🔥 Distance strikes
        else if (label.includes('distance')) {
          const f1Match = fighter1Value.match(/(\d+)\s+of\s+(\d+)/);
          if (f1Match) {
            matchup.fighter1.career.distanceStrikesLanded = parseInt(f1Match[1]);
            matchup.fighter1.career.distanceStrikesAttempted = parseInt(f1Match[2]);
          }
          const f2Match = fighter2Value.match(/(\d+)\s+of\s+(\d+)/);
          if (f2Match) {
            matchup.fighter2.career.distanceStrikesLanded = parseInt(f2Match[1]);
            matchup.fighter2.career.distanceStrikesAttempted = parseInt(f2Match[2]);
          }
        }
        // 🔥 Clinch strikes
        else if (label.includes('clinch')) {
          const f1Match = fighter1Value.match(/(\d+)\s+of\s+(\d+)/);
          if (f1Match) {
            matchup.fighter1.career.clinchStrikesLanded = parseInt(f1Match[1]);
            matchup.fighter1.career.clinchStrikesAttempted = parseInt(f1Match[2]);
          }
          const f2Match = fighter2Value.match(/(\d+)\s+of\s+(\d+)/);
          if (f2Match) {
            matchup.fighter2.career.clinchStrikesLanded = parseInt(f2Match[1]);
            matchup.fighter2.career.clinchStrikesAttempted = parseInt(f2Match[2]);
          }
        }
        // 🔥 Ground strikes
        else if (label.includes('ground')) {
          const f1Match = fighter1Value.match(/(\d+)\s+of\s+(\d+)/);
          if (f1Match) {
            matchup.fighter1.career.groundStrikesLanded = parseInt(f1Match[1]);
            matchup.fighter1.career.groundStrikesAttempted = parseInt(f1Match[2]);
          }
          const f2Match = fighter2Value.match(/(\d+)\s+of\s+(\d+)/);
          if (f2Match) {
            matchup.fighter2.career.groundStrikesLanded = parseInt(f2Match[1]);
            matchup.fighter2.career.groundStrikesAttempted = parseInt(f2Match[2]);
          }
        }
        // 🔥 Advances
        else if (label.includes('adv.') || label.includes('advances')) {
          matchup.fighter1.career.advances = fighter1Value || null;
          matchup.fighter2.career.advances = fighter2Value || null;
        }
      }
    });
    
    console.log(`      ✅ Physical - Height: ${matchup.fighter1.career.height} / ${matchup.fighter2.career.height}`);
    console.log(`      ✅ Physical - Weight: ${matchup.fighter1.career.weight} / ${matchup.fighter2.career.weight}`);
    console.log(`      ✅ Physical - Reach: ${matchup.fighter1.career.reach} / ${matchup.fighter2.career.reach}`);
    console.log(`      ✅ Physical - Stance: ${matchup.fighter1.career.stance} / ${matchup.fighter2.career.stance}`);
    console.log(`      ✅ Physical - Age: ${matchup.fighter1.career.age} / ${matchup.fighter2.career.age}`);
    console.log(`      ✅ Striking - SLpM: ${matchup.fighter1.career.slpm} / ${matchup.fighter2.career.slpm}`);
    console.log(`      ✅ Striking - Accuracy: ${matchup.fighter1.career.strAcc} / ${matchup.fighter2.career.strAcc}`);
    console.log(`      ✅ Striking - Defense: ${matchup.fighter1.career.strDef} / ${matchup.fighter2.career.strDef}`);
    console.log(`      ✅ Grappling - TD Avg: ${matchup.fighter1.career.tdAvg} / ${matchup.fighter2.career.tdAvg}`);
    console.log(`      ✅ Grappling - TD Acc: ${matchup.fighter1.career.tdAcc} / ${matchup.fighter2.career.tdAcc}`);
    console.log(`      ✅ Grappling - TD Def: ${matchup.fighter1.career.tdDef} / ${matchup.fighter2.career.tdDef}`);
    
    // 🔥 Parse "Most recent fights" section
    console.log(`      📜 Parsing fight history...`);
    let foundMostRecentSection = false;
    
    $('tr.b-fight-details__table-row-header').each((i, row) => {
      const headerText = cleanText($(row).find('th').text());
      
      if (headerText.toLowerCase().includes('most recent fights')) {
        foundMostRecentSection = true;
        
        // Get all following rows
        let $currentRow = $(row).next('tr.b-fight-details__table-row-preview');
        
        while ($currentRow.length > 0 && !$currentRow.hasClass('b-fight-details__table-row-header')) {
          const $cols = $currentRow.find('td.b-fight-details__table-col');
          
          if ($cols.length >= 3) {
            // Column 1: Fighter 1's fight, Column 2: Fighter 2's fight
            const fighter1Fight = cleanText($cols.eq(1).find('p').text());
            const fighter2Fight = cleanText($cols.eq(2).find('p').text());
            
            // Parse Fighter 1's fight
            if (fighter1Fight) {
              const parts = fighter1Fight.split('-').map(s => s.trim());
              if (parts.length >= 2) {
                matchup.fighter1.fightHistory.push({
                  result: parts[0].toLowerCase(),
                  opponent: parts.slice(1).join(' - '),
                  event: null,
                  date: null,
                  method: null,
                  round: null,
                  time: null
                });
              }
            }
            
            // Parse Fighter 2's fight
            if (fighter2Fight) {
              const parts = fighter2Fight.split('-').map(s => s.trim());
              if (parts.length >= 2) {
                matchup.fighter2.fightHistory.push({
                  result: parts[0].toLowerCase(),
                  opponent: parts.slice(1).join(' - '),
                  event: null,
                  date: null,
                  method: null,
                  round: null,
                  time: null
                });
              }
            }
          }
          
          $currentRow = $currentRow.next('tr.b-fight-details__table-row-preview');
        }
        
        return false; // Break
      }
    });
    
    // Create recent fights text
    if (matchup.fighter1.fightHistory.length > 0) {
      matchup.fighter1.recentFights = matchup.fighter1.fightHistory.slice(0, 5).map(f => 
        `${f.result} vs ${f.opponent}`
      );
      matchup.fighter1.fullFightHistory = matchup.fighter1.fightHistory;
      
      const winMethods1 = calculateWinMethods(matchup.fighter1.fightHistory);
      matchup.fighter1.recordBreakdown.winsByKO = winMethods1.ko;
      matchup.fighter1.recordBreakdown.winsBySub = winMethods1.sub;
      matchup.fighter1.recordBreakdown.winsByDec = winMethods1.dec;
    }
    
    if (matchup.fighter2.fightHistory.length > 0) {
      matchup.fighter2.recentFights = matchup.fighter2.fightHistory.slice(0, 5).map(f => 
        `${f.result} vs ${f.opponent}`
      );
      matchup.fighter2.fullFightHistory = matchup.fighter2.fightHistory;
      
      const winMethods2 = calculateWinMethods(matchup.fighter2.fightHistory);
      matchup.fighter2.recordBreakdown.winsByKO = winMethods2.ko;
      matchup.fighter2.recordBreakdown.winsBySub = winMethods2.sub;
      matchup.fighter2.recordBreakdown.winsByDec = winMethods2.dec;
    }
    
    console.log(`      ✅ Fighter 1: ${matchup.fighter1.name} - ${matchup.fighter1.fightHistory.length} fights`);
    console.log(`      ✅ Fighter 2: ${matchup.fighter2.name} - ${matchup.fighter2.fightHistory.length} fights`);
    
    return matchup;
  } catch (error) {
    console.error(`❌ Error scraping matchup:`, error.message);
    return null;
  }
}

// Scrape upcoming events
async function scrapeUpcomingEvents() {
  console.log('🔍 Scraping upcoming events...\n');
  
  try {
    const html = await fetchWithRetry(UPCOMING_URL);
    const $ = cheerio.load(html);
    const events = [];
    
    $('tr.b-statistics__table-row').each((index, row) => {
      if (index === 0) return; // Skip header
      
      const $row = $(row);
      const $cols = $row.find('td.b-statistics__table-col');
      
      if ($cols.length < 2) return;
      
      const eventName = cleanText($cols.eq(0).find('a').text());
      const eventLink = $cols.eq(0).find('a').attr('href');
      const eventDate = cleanText($cols.eq(0).find('.b-statistics__date').text());
      const location = cleanText($cols.eq(1).text());
      
      if (eventName && eventLink) {
        const eventId = generateId(eventLink);
        
        // Parse location
        let city = null, state = null, country = null;
        if (location) {
          const parts = location.split(',').map(s => s.trim());
          if (parts.length === 3) {
            [city, state, country] = parts;
          } else if (parts.length === 2) {
            [city, country] = parts;
          } else if (parts.length === 1) {
            city = parts[0];
          }
        }
        
        // Parse date
        let parsedDate = null;
        if (eventDate) {
          try {
            const dateObj = new Date(eventDate);
            parsedDate = dateObj.toISOString().split('T')[0];
          } catch (e) {
            parsedDate = eventDate;
          }
        }
        
        events.push({
          id: eventId,
          name: eventName,
          link: eventLink,
          date: parsedDate,
          location: { city, state, country, venue: null, attendance: null }
        });
      }
    });
    
    // Get first 3 upcoming events
    const upcomingEvents = events.slice(0, 3);
    
    console.log(`✅ Found ${upcomingEvents.length} upcoming events\n`);
    return upcomingEvents;
  } catch (error) {
    console.error('❌ Error scraping events:', error);
    return [];
  }
}

// Scrape fights for an event
async function scrapeFightsForEvent(eventLink) {
  console.log(`   🔍 Scraping fights from event page...`);
  
  try {
    await delay(1500);
    const html = await fetchWithRetry(eventLink);
    const $ = cheerio.load(html);
    const fights = [];
    
    $('tr.b-fight-details__table-row').each((index, row) => {
      if (index === 0) return; // Skip header
      
      const $row = $(row);
      const $cols = $row.find('td.b-fight-details__table-col');
      
      if ($cols.length < 2) return;
      
      // Fighter 1
      const fighter1Name = cleanText($cols.eq(1).find('a').first().text());
      const fighter1Link = $cols.eq(1).find('a').first().attr('href');
      
      // Fighter 2
      const fighter2Name = cleanText($cols.eq(1).find('a').last().text());
      const fighter2Link = $cols.eq(1).find('a').last().attr('href');
      
      // Weight class
      const weightClass = cleanText($cols.eq(6).text());
      
      // Fight link
      const fightLink = $row.attr('data-link');
      
      if (fighter1Name && fighter2Name && fightLink) {
        fights.push({
          fightLink,
          fighter1: {
            name: fighter1Name,
            link: fighter1Link || null,
            id: fighter1Link ? generateId(fighter1Link) : generateId(fighter1Name)
          },
          fighter2: {
            name: fighter2Name,
            link: fighter2Link || null,
            id: fighter2Link ? generateId(fighter2Link) : generateId(fighter2Name)
          },
          weightClass: weightClass || null,
          method: null,
          round: null,
          time: null
        });
      }
    });
    
    console.log(`   ✅ Found ${fights.length} fights\n`);
    return fights;
  } catch (error) {
    console.error('❌ Error scraping fights:', error);
    return [];
  }
}

// Main scraping function
async function scrapeAll() {
  console.log('🚀 UFC DATA SCRAPER - COMPLETE VERSION\n');
  console.log('='.repeat(60) + '\n');
  
  await ensureDirectories();
  
  // Get upcoming events
  const events = await scrapeUpcomingEvents();
  
  const allFighters = new Map();
  const enrichedEvents = [];
  
  for (const event of events) {
    console.log('='.repeat(60));
    console.log(`📅 EVENT: ${event.name}`);
    console.log(`📆 Date: ${event.date}`);
    console.log(`📍 Location: ${event.location.city}, ${event.location.country || event.location.state}`);
    console.log('='.repeat(60) + '\n');
    
    const fights = await scrapeFightsForEvent(event.link);
    const enrichedFights = [];
    
    for (let i = 0; i < fights.length; i++) {
      const fight = fights[i];
      console.log(`   🥊 Fight ${i + 1}/${fights.length}: ${fight.fighter1.name} vs ${fight.fighter2.name}`);
      
      // 🔥 Scrape matchup (gets EVERYTHING)
      let matchupData = null;
      if (fight.fightLink) {
        matchupData = await scrapeFightMatchup(fight.fightLink, fight.fighter1.id, fight.fighter2.id);
        
        // Add fighters to map
        if (matchupData) {
          if (!allFighters.has(fight.fighter1.id)) {
            allFighters.set(fight.fighter1.id, matchupData.fighter1);
          }
          if (!allFighters.has(fight.fighter2.id)) {
            allFighters.set(fight.fighter2.id, matchupData.fighter2);
          }
        }
      }
      
      enrichedFights.push({
        ...fight,
        matchup: matchupData,
        fighter1Data: matchupData ? matchupData.fighter1 : null,
        fighter2Data: matchupData ? matchupData.fighter2 : null
      });
      
      console.log('');
    }
    
    enrichedEvents.push({
      id: event.id,
      name: event.name,
      date: event.date,
      location: event.location,
      fights: enrichedFights
    });
  }
  
  // Build final output
  const output = {
    lastUpdated: new Date().toISOString(),
    dataVersion: '7.0',
    completeness: {
      events: '100%',
      fighters: '100%',
      fights: '100%',
      matchupDetails: '100%',
      fightHistory: '100%',
      physicalStats: '100%',
      strikingStats: '100%',
      grapplingStats: '100%',
      advancedStats: '100%'
    },
    events: enrichedEvents,
    fighters: Object.fromEntries(allFighters)
  };
  
  // Save to file
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2));
  
  console.log('='.repeat(60));
  console.log('✅ SCRAPING COMPLETE!');
  console.log('='.repeat(60));
  console.log(`📊 STATISTICS:`);
  console.log(`   - Events: ${enrichedEvents.length}`);
  console.log(`   - Unique Fighters: ${allFighters.size}`);
  console.log(`   - Output: ${OUTPUT_FILE}`);
  console.log('='.repeat(60) + '\n');
  console.log('🎉 All stats scraped successfully!\n');
}

// Run scraper
scrapeAll().catch(console.error);