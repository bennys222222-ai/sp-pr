// src/api/localUFC.js
// 🔥 LOCAL UFC DATA LOADER - WIN METHODS FIXED

const SCRAPED_DATA_PATH = '/data/gidstats-final.json';

let cachedData = null;

/**
 * 🔥 PARSE COUNTRY CODE FROM COUNTRY NAME
 */
function getCountryCode(countryName) {
  if (!countryName) return null;
  
  const countryMap = {
    'armenia': 'am',
    'new zealand': 'nz',
    'palestine': 'ps',
    'ireland': 'ie',
    'switzerland': 'ch',
    'usa': 'us',
    'united states': 'us',
    'norway': 'no',
    'kyrgyzstan': 'kg',
    'moldova': 'md',
    'bahrain': 'bh',
    'tajikistan': 'tj',
    'united kingdom': 'gb',
    'scotland': 'gb',
    'england': 'gb',
    'russia': 'ru',
    'turkey': 'tr',
    'brazil': 'br',
    'france': 'fr',
    'azerbaijan': 'az',
    'canada': 'ca',
    'denmark': 'dk',
    'poland': 'pl',
    'uzbekistan': 'uz',
    'mexico': 'mx',
    'georgia': 'ge',
    'czechia': 'cz',
    'czech republic': 'cz',
    'austria': 'at',
    'portugal': 'pt',
    'angola': 'ao',
    'japan': 'jp',
    'nigeria': 'ng',
    'argentina': 'ar',
    'kazakhstan': 'kz',
    'morocco': 'ma',
    'italy': 'it'
  };
  
  const normalized = countryName.toLowerCase().trim();
  return countryMap[normalized] || normalized.substring(0, 2);
}

/**
 * 🔥 GET WEIGHT CLASS DISPLAY NAME
 */
function getWeightClassDisplay(weightLbs) {
  if (!weightLbs) return null;
  
  const weight = parseFloat(weightLbs);
  
  if (weight <= 115) return 'Strawweight';
  if (weight <= 125) return 'Flyweight';
  if (weight <= 135) return 'Bantamweight';
  if (weight <= 145) return 'Featherweight';
  if (weight <= 155) return 'Lightweight';
  if (weight <= 170) return 'Welterweight';
  if (weight <= 185) return 'Middleweight';
  if (weight <= 205) return 'Light Heavyweight';
  if (weight <= 265) return 'Heavyweight';
  
  return 'Heavyweight';
}

/**
 * 🔥 PARSE GIDSTATS DATE TO ISO FORMAT
 */
function parseGIDStatsDate(dateStr) {
  if (!dateStr) return null;
  
  // Format: "22.11.25" -> "2025-11-22"
  const parts = dateStr.split('.');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
    return `${year}-${month}-${day}`;
  }
  
  return dateStr;
}

/**
 * 🔥 FIX FIGHTER NAME SPACING
 */
function fixFighterName(name) {
  if (!name) return '';
  
  // GIDStats sometimes has no spaces: "ArmanTsarukyan" -> "Arman Tsarukyan"
  // Insert space before capital letters that follow lowercase
  return name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 🔥 PARSE PERCENTAGE STRING TO NUMBER
 */
function parsePercent(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return val;
  const num = parseFloat(val.toString().replace('%', ''));
  return isNaN(num) ? null : num;
}

/**
 * 🔥 PARSE NUMBER STRING
 */
function parseNumber(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return val;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
}

/**
 * 🔥 SAFE INTEGER - RETURNS 0 IF NULL/UNDEFINED
 */
function safeInt(val) {
  if (val === null || val === undefined) return 0;
  const num = parseInt(val);
  return isNaN(num) ? 0 : num;
}

export async function loadUFCData() {
  if (cachedData) {
    console.log('✅ Using cached UFC data');
    return cachedData;
  }

  try {
    const response = await fetch(SCRAPED_DATA_PATH);
    
    if (!response.ok) {
      throw new Error(`Failed to load UFC data: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('✅ Loaded UFC data:', {
      events: data.events?.length,
      fighters: data.fighters?.length,
      stats: data.stats
    });

    // 🔥 PROCESS EVENTS - ADD DATE & LOCATION (FIXED)
    if (data.events) {
      data.events = data.events.map(event => {
        const eventId = event.url?.split('/').filter(Boolean).pop()?.replace('.html', '') || event.url;
        const location = event.location?.replace(/\.$/, '') || 'Location TBA'; // Remove trailing dot
        
        console.log(`📍 Event: ${event.name} -> Location: ${location}`);
        
        return {
          ...event,
          id: eventId,
          date: parseGIDStatsDate(event.date),
          location: location,
          time: event.time || null
        };
      });
    }

    // Cache data
    cachedData = data;
    
    return data;
  } catch (error) {
    console.error('❌ UFC Data Error:', error);
    throw error;
  }
}

// 🔥 MAP FIGHTER DATA FROM SCRAPED FORMAT - WIN METHODS FIXED
export function mapFighterData(scrapedFighter) {
  if (!scrapedFighter) return null;

  const name = fixFighterName(scrapedFighter.name);
  const nameParts = name.split(' ');
  
  // 🔥 WIN METHODS - ALWAYS RETURN INTEGER (0 IF NULL)
  const winsKO = safeInt(scrapedFighter.winsKO);
  const winsSub = safeInt(scrapedFighter.winsSub);
  const winsDec = safeInt(scrapedFighter.winsDec);
  
  console.log(`🥊 ${name} Win Methods:`, {
    KO: winsKO,
    Sub: winsSub,
    Dec: winsDec,
    raw: {
      KO: scrapedFighter.winsKO,
      Sub: scrapedFighter.winsSub,
      Dec: scrapedFighter.winsDec
    }
  });
  
  return {
    FighterId: scrapedFighter.url?.split('/').pop()?.replace('.html', '') || null,
    Name: name,
    FirstName: nameParts[0] || '',
    LastName: nameParts.slice(1).join(' ') || '',
    Nickname: scrapedFighter.nickname?.replace(/['"]/g, '') || '',
    
    // Record
    Wins: safeInt(scrapedFighter.wins),
    Losses: safeInt(scrapedFighter.losses),
    Draws: safeInt(scrapedFighter.draws),
    NoContests: safeInt(scrapedFighter.noContests),
    Record: `${scrapedFighter.wins || 0}-${scrapedFighter.losses || 0}${scrapedFighter.draws ? `-${scrapedFighter.draws}` : ''}`,
    
    // Physical Stats
    Height: parseNumber(scrapedFighter.height),
    HeightInches: parseNumber(scrapedFighter.height),
    HeightCm: parseNumber(scrapedFighter.heightCm),
    HeightDisplay: scrapedFighter.height ? `${scrapedFighter.height}"` : null,
    
    Weight: parseNumber(scrapedFighter.weight),
    WeightLbs: parseNumber(scrapedFighter.weight),
    WeightKg: parseNumber(scrapedFighter.weightKg),
    WeightClass: getWeightClassDisplay(scrapedFighter.weight),
    WeightDisplay: scrapedFighter.weight ? `${scrapedFighter.weight} lbs` : null,
    
    Reach: parseNumber(scrapedFighter.reach),
    ReachInches: parseNumber(scrapedFighter.reach),
    ReachCm: parseNumber(scrapedFighter.reachCm),
    ReachDisplay: scrapedFighter.reach ? `${scrapedFighter.reach}"` : null,
    
    LegReach: parseNumber(scrapedFighter.legReach),
    LegReachInches: parseNumber(scrapedFighter.legReach),
    LegReachCm: parseNumber(scrapedFighter.legReachCm),
    LegReachDisplay: scrapedFighter.legReach ? `${scrapedFighter.legReach}"` : null,
    
    Age: scrapedFighter.age,
    Stance: scrapedFighter.stance,
    DOB: scrapedFighter.born,
    Born: scrapedFighter.born,
    
    // Country
    Country: scrapedFighter.country,
    CountryCode: getCountryCode(scrapedFighter.country),
    
    // Fighting Style
    Style: scrapedFighter.style,
    FightingStyle: scrapedFighter.style,
    
    // 🔥 STRIKING STATS
    SignificantStrikesLandedPerMinute: parseNumber(scrapedFighter.sigStrikesLandedPerMin),
    SLpM: parseNumber(scrapedFighter.sigStrikesLandedPerMin),
    
    SignificantStrikingAccuracy: parsePercent(scrapedFighter.strikingAccuracy),
    StrAcc: parsePercent(scrapedFighter.strikingAccuracy),
    StrikingAccuracy: parsePercent(scrapedFighter.strikingAccuracy),
    
    SignificantStrikesAbsorbedPerMinute: parseNumber(scrapedFighter.sigStrikesAbsorbedPerMin),
    SApM: parseNumber(scrapedFighter.sigStrikesAbsorbedPerMin),
    
    SignificantStrikeDefense: parsePercent(scrapedFighter.sigStrikeDefense),
    StrDef: parsePercent(scrapedFighter.sigStrikeDefense),
    StrikeDefense: parsePercent(scrapedFighter.sigStrikeDefense),
    
    SignificantStrikesLanded: scrapedFighter.sigStrikesLanded,
    SigStrikesLanded: scrapedFighter.sigStrikesLanded,
    
    SignificantStrikesAttempted: scrapedFighter.sigStrikesAttempted,
    SigStrikesAttempted: scrapedFighter.sigStrikesAttempted,
    
    TotalStrikesLanded: scrapedFighter.totalStrikesLanded,
    TotalStrikesAttempted: scrapedFighter.totalStrikesAttempted,
    TotalStrikingAccuracy: parsePercent(scrapedFighter.totalStrikingAccuracy),
    
    Knockdowns: parseNumber(scrapedFighter.knockdownAvg),
    KnockdownAvg: parseNumber(scrapedFighter.knockdownAvg),
    KnockdownsPerFight: parseNumber(scrapedFighter.knockdownAvg),
    
    // 🔥 STRIKE DISTRIBUTION
    StandingCount: scrapedFighter.standingCount,
    StandingPercent: parsePercent(scrapedFighter.standingPercent),
    StandingPercentage: parsePercent(scrapedFighter.standingPercent),
    
    ClinchCount: scrapedFighter.clinchCount,
    ClinchPercent: parsePercent(scrapedFighter.clinchPercent),
    ClinchPercentage: parsePercent(scrapedFighter.clinchPercent),
    
    GroundCount: scrapedFighter.groundCount,
    GroundPercent: parsePercent(scrapedFighter.groundPercent),
    GroundPercentage: parsePercent(scrapedFighter.groundPercent),
    
    HeadCount: scrapedFighter.headCount,
    HeadPercent: parsePercent(scrapedFighter.headPercent),
    HeadPercentage: parsePercent(scrapedFighter.headPercent),
    
    BodyCount: scrapedFighter.bodyCount,
    BodyPercent: parsePercent(scrapedFighter.bodyPercent),
    BodyPercentage: parsePercent(scrapedFighter.bodyPercent),
    
    LegCount: scrapedFighter.legCount,
    LegPercent: parsePercent(scrapedFighter.legPercent),
    LegPercentage: parsePercent(scrapedFighter.legPercent),
    
    // 🔥 GRAPPLING STATS
    TakedownsPer15Minutes: parseNumber(scrapedFighter.takedownsPerBout),
    TdAvg: parseNumber(scrapedFighter.takedownsPerBout),
    TakedownAverage: parseNumber(scrapedFighter.takedownsPerBout),
    TakedownsPerFight: parseNumber(scrapedFighter.takedownsPerBout),
    
    TakedownAccuracy: parsePercent(scrapedFighter.takedownAccuracy),
    TdAcc: parsePercent(scrapedFighter.takedownAccuracy),
    
    TakedownDefense: parsePercent(scrapedFighter.takedownDefense),
    TdDef: parsePercent(scrapedFighter.takedownDefense),
    
    TakedownsLanded: scrapedFighter.takedownsLanded,
    TakedownsAttempted: scrapedFighter.takedownsAttempted,
    
    SubmissionsPer15Minutes: parseNumber(scrapedFighter.submissionsAvg),
    SubAvg: parseNumber(scrapedFighter.submissionsAvg),
    SubmissionAverage: parseNumber(scrapedFighter.submissionsAvg),
    SubmissionsPerFight: parseNumber(scrapedFighter.submissionsAvg),
    SubmissionAttempts: parseNumber(scrapedFighter.submissionsAvg),
    
    // 🔥 WIN METHODS - ALWAYS INTEGER, NEVER NULL
    WinsKO: winsKO,
    WinsKnockout: winsKO,
    WinsByKO: winsKO,
    WinsByKnockout: winsKO,
    WinsByTKO: winsKO,
    
    WinsSub: winsSub,
    WinsSubmission: winsSub,
    WinsBySubmission: winsSub,
    
    WinsDec: winsDec,
    WinsDecision: winsDec,
    WinsByDecision: winsDec,
    
    WinMethodKOPercent: parsePercent(scrapedFighter.winMethodKOPercent),
    WinMethodKOPercentage: parsePercent(scrapedFighter.winMethodKOPercent),
    
    WinMethodSubPercent: parsePercent(scrapedFighter.winMethodSubPercent),
    WinMethodSubPercentage: parsePercent(scrapedFighter.winMethodSubPercent),
    
    WinMethodDecPercent: parsePercent(scrapedFighter.winMethodDecPercent),
    WinMethodDecPercentage: parsePercent(scrapedFighter.winMethodDecPercent),
    
    // 🔥 FIGHT TIME
    AvgFightTime: scrapedFighter.avgFightTime,
    AverageFightTime: scrapedFighter.avgFightTime,
    
    AvgFightTimeUFC: scrapedFighter.avgFightTimeUFC,
    AverageFightTimeUFC: scrapedFighter.avgFightTimeUFC,
    
    FirstRoundFinishes: scrapedFighter.firstRoundFinishes,
    
    // 🔥 RANKINGS
    UFCRanking: scrapedFighter.ufcRanking,
    Ranking: scrapedFighter.ufcRanking,
    
    PFPRanking: scrapedFighter.pfpRanking,
    PoundForPoundRanking: scrapedFighter.pfpRanking,
    
    // 🔥 PROMOTIONS
    PromotionStats: scrapedFighter.promotionStats,
    UFCBoutsForStats: scrapedFighter.ufcBoutsForStats,
    
    // Keep original
    _gidstats: scrapedFighter
  };
}

// 🔥 MAP FIGHT DATA FROM SCRAPED FORMAT
export function mapFightData(scrapedFight) {
  if (!scrapedFight) return null;

  const fighter1Name = fixFighterName(scrapedFight.fighter1?.name);
  const fighter2Name = fixFighterName(scrapedFight.fighter2?.name);

  return {
    FightId: scrapedFight.url?.split('/').pop()?.replace('.html', ''),
    WeightClass: scrapedFight.weightClass,
    NumberOfRounds: scrapedFight.rounds,
    Rounds: scrapedFight.rounds,
    ScheduledRounds: scrapedFight.rounds,
    BoutFormat: scrapedFight.boutFormat,
    
    // Event Info
    EventName: scrapedFight.eventName,
    EventDate: scrapedFight.eventDate,
    EventTime: scrapedFight.eventTime,
    
    Fighters: [
      {
        FighterId: scrapedFight.fighter1?.url?.split('/').pop()?.replace('.html', ''),
        Name: fighter1Name,
        FirstName: fighter1Name?.split(' ')[0],
        LastName: fighter1Name?.split(' ').slice(1).join(' '),
        
        Ranking: scrapedFight.fighter1?.ranking,
        UFCRanking: scrapedFight.fighter1?.ranking,
        
        Height: parseNumber(scrapedFight.fighter1?.height),
        HeightCm: parseNumber(scrapedFight.fighter1?.heightCm),
        Weight: parseNumber(scrapedFight.fighter1?.lastWeighIn),
        WeightKg: parseNumber(scrapedFight.fighter1?.lastWeighInKg),
        WeightClass: getWeightClassDisplay(scrapedFight.fighter1?.lastWeighIn),
        Reach: parseNumber(scrapedFight.fighter1?.reach),
        ReachCm: parseNumber(scrapedFight.fighter1?.reachCm),
        LegReach: parseNumber(scrapedFight.fighter1?.legReach),
        LegReachCm: parseNumber(scrapedFight.fighter1?.legReachCm),
        Age: scrapedFight.fighter1?.age,
        
        Order: 1,
      },
      {
        FighterId: scrapedFight.fighter2?.url?.split('/').pop()?.replace('.html', ''),
        Name: fighter2Name,
        FirstName: fighter2Name?.split(' ')[0],
        LastName: fighter2Name?.split(' ').slice(1).join(' '),
        
        Ranking: scrapedFight.fighter2?.ranking,
        UFCRanking: scrapedFight.fighter2?.ranking,
        
        Height: parseNumber(scrapedFight.fighter2?.height),
        HeightCm: parseNumber(scrapedFight.fighter2?.heightCm),
        Weight: parseNumber(scrapedFight.fighter2?.lastWeighIn),
        WeightKg: parseNumber(scrapedFight.fighter2?.lastWeighInKg),
        WeightClass: getWeightClassDisplay(scrapedFight.fighter2?.lastWeighIn),
        Reach: parseNumber(scrapedFight.fighter2?.reach),
        ReachCm: parseNumber(scrapedFight.fighter2?.reachCm),
        LegReach: parseNumber(scrapedFight.fighter2?.legReach),
        LegReachCm: parseNumber(scrapedFight.fighter2?.legReachCm),
        Age: scrapedFight.fighter2?.age,
        
        Order: 2,
      }
    ]
  };
}

// 🔥 BUILD FIGHTER DIRECTORY FROM SCRAPED DATA
export function buildFighterDirectory(fighters = []) {
  const directory = new Map();
  
  fighters.forEach(fighter => {
    const mapped = mapFighterData(fighter);
    if (!mapped) return;
    
    // Index by ID
    if (mapped.FighterId) {
      directory.set(`id:${mapped.FighterId}`, mapped);
    }
    
    // Index by Name (normalized)
    const nameLower = mapped.Name?.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (nameLower) {
      directory.set(`name:${nameLower}`, mapped);
    }
  });
  
  console.log('✅ Built fighter directory:', directory.size, 'fighters');
  
  return directory;
}

export default {
  loadUFCData,
  mapFighterData,
  mapFightData,
  buildFighterDirectory
};