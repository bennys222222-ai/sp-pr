const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/**
 * Load all UFC data from backend
 */
export async function loadUFCData() {
  try {
    const response = await fetch(`${API_URL}/api/ufc/data`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    
    console.log('✅ Loaded UFC data:', {
      events: data.events?.length || 0,
      fighters: Object.keys(data.fighters || {}).length,
      lastUpdated: data.lastUpdated
    });
    
    return data;
  } catch (error) {
    console.error('❌ Error loading UFC data:', error);
    return { events: [], fighters: {}, lastUpdated: null };
  }
}

/**
 * Find fighter by ID in scraped data
 */
export function findFighterById(fighters, fighterId) {
  if (!fighters || !fighterId) return null;
  return fighters[fighterId] || null;
}

/**
 * Map scraped fighter data to app format
 */
export function mapFighterData(scrapedFighter, matchupData = null) {
  if (!scrapedFighter) return null;
  
  const career = scrapedFighter.career || {};
  const matchup = matchupData || {};
  
  // Parse percentages (remove % sign for calculations)
  const parsePercent = (val) => {
    if (!val) return null;
    const num = parseFloat(val.toString().replace('%', ''));
    return isNaN(num) ? null : num;
  };
  
  const parseNumber = (val) => {
    if (!val) return null;
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
  };
  
  return {
    id: scrapedFighter.id,
    name: scrapedFighter.name,
    nickname: scrapedFighter.nickname,
    record: scrapedFighter.record,
    
    // Physical stats (prioritize matchup data, fallback to career)
    Height: matchup.heightInches || career.heightInches,
    HeightDisplay: matchup.heightDisplay || career.height,
    Weight: matchup.weightLbs || career.weightLbs,
    WeightDisplay: matchup.weightDisplay || career.weight,
    Reach: matchup.reachInches || career.reachInches,
    ReachDisplay: matchup.reachDisplay || career.reach,
    LegReach: matchup.legReachInches,
    Stance: matchup.stance || career.stance,
    DOB: matchup.dob || career.dob,
    
    // Striking stats
    SignificantStrikesLandedPerMinute: parseNumber(matchup.slpm || career.slpm),
    SLpM: matchup.slpm || career.slpm,
    SignificantStrikingAccuracy: parsePercent(matchup.strAcc || career.strAcc),
    StrAcc: matchup.strAcc || career.strAcc,
    SignificantStrikesAbsorbedPerMinute: parseNumber(matchup.sapm || career.sapm),
    SApM: matchup.sapm || career.sapm,
    SignificantStrikeDefense: parsePercent(matchup.strDef || career.strDef),
    StrDef: matchup.strDef || career.strDef,
    
    // Grappling stats
    TakedownsPer15Minutes: parseNumber(matchup.tdAvg || career.tdAvg),
    TdAvg: matchup.tdAvg || career.tdAvg,
    TakedownAccuracy: parsePercent(matchup.tdAcc || career.tdAcc),
    TdAcc: matchup.tdAcc || career.tdAcc,
    TakedownDefense: parsePercent(matchup.tdDef || career.tdDef),
    TdDef: matchup.tdDef || career.tdDef,
    SubmissionsPer15Minutes: parseNumber(matchup.subAvg || career.subAvg),
    SubAvg: matchup.subAvg || career.subAvg,
    
    // Recent fights
    RecentFights: scrapedFighter.recentFights || []
  };
}

/**
 * Map scraped fight to app format
 */
export function mapFightData(scrapedFight) {
  if (!scrapedFight) return null;
  
  const fighter1Matchup = scrapedFight.matchup?.fighter1 || {};
  const fighter2Matchup = scrapedFight.matchup?.fighter2 || {};
  
  return {
    FightId: scrapedFight.fightLink,
    WeightClass: scrapedFight.weightClass,
    Method: scrapedFight.method,
    Rounds: scrapedFight.round ? parseInt(scrapedFight.round) : 3,
    ResultRound: scrapedFight.round,
    ResultClock: scrapedFight.time,
    Fighters: [
      {
        ...mapFighterData(scrapedFight.fighter1Data, fighter1Matchup),
        Name: scrapedFight.fighter1.name,
        FighterId: scrapedFight.fighter1.id,
        Nickname: fighter1Matchup.nickname
      },
      {
        ...mapFighterData(scrapedFight.fighter2Data, fighter2Matchup),
        Name: scrapedFight.fighter2.name,
        FighterId: scrapedFight.fighter2.id,
        Nickname: fighter2Matchup.nickname
      }
    ]
  };
}

export default {
  loadUFCData,
  findFighterById,
  mapFighterData,
  mapFightData
};