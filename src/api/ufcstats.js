// UFC Stats API - Scraping and enrichment
const UFCSTATS_BASE = 'http://ufcstats.com/statistics/fighters';
const UFC_API_BASE = 'https://d29dxerjsp82wz.cloudfront.net/api/v3';

/**
 * Fetch detailed fighter stats from UFCStats.com
 */
export async function fetchUFCStatsProfile(fighterName) {
  try {
    // This would normally scrape UFCStats.com
    // For now, return enhanced mock data structure
    console.log(`[UFCStats] Fetching profile for: ${fighterName}`);
    
    return {
      name: fighterName,
      height: null,
      weight: null,
      reach: null,
      legReach: null,
      stance: null,
      dob: null,
      slpm: null, // Significant strikes landed per minute
      strAcc: null, // Striking accuracy
      sapm: null, // Significant strikes absorbed per minute
      strDef: null, // Striking defense
      tdAvg: null, // Takedown average per 15 min
      tdAcc: null, // Takedown accuracy
      tdDef: null, // Takedown defense
      subAvg: null, // Submission average per 15 min
    };
  } catch (error) {
    console.warn(`[UFCStats] Error fetching ${fighterName}:`, error);
    return null;
  }
}

/**
 * Fetch event location details
 */
export async function fetchEventLocation(eventId) {
  try {
    console.log(`[UFC API] Fetching location for event: ${eventId}`);
    
    // Mock enhanced location data
    return {
      venue: null,
      city: null,
      state: null,
      country: null,
      timezone: null,
      capacity: null,
    };
  } catch (error) {
    console.warn(`[UFC API] Error fetching event location:`, error);
    return null;
  }
}

/**
 * Enrich fighter data with multiple sources
 */
export async function enrichFighterData(fighter, apiData = {}) {
  const ufcStatsData = await fetchUFCStatsProfile(fighter.name);
  
  return {
    ...fighter,
    // Physical attributes
    height: fighter.height || ufcStatsData?.height || apiData.Height || apiData.HeightInches,
    weight: fighter.weight || ufcStatsData?.weight || apiData.Weight,
    reach: fighter.reach || ufcStatsData?.reach || apiData.Reach,
    legReach: fighter.legReach || ufcStatsData?.legReach || apiData.LegReach,
    stance: fighter.stance || ufcStatsData?.stance || apiData.Stance,
    age: fighter.age || apiData.Age,
    dob: fighter.dob || ufcStatsData?.dob || apiData.BirthDate || apiData.DOB,
    
    // Striking stats
    slpm: ufcStatsData?.slpm || apiData.SignificantStrikesLandedPerMinute || apiData.SigStrikesPerMinute,
    strAcc: ufcStatsData?.strAcc || apiData.SignificantStrikingAccuracy || apiData.StrikingAccuracy,
    sapm: ufcStatsData?.sapm || apiData.SignificantStrikesAbsorbedPerMinute || apiData.StrikesAbsorbedPerMinute,
    strDef: ufcStatsData?.strDef || apiData.SignificantStrikeDefense || apiData.StrikingDefense,
    
    // Grappling stats
    tdAvg: ufcStatsData?.tdAvg || apiData.TakedownsPer15Minutes || apiData.TakedownAverage,
    tdAcc: ufcStatsData?.tdAcc || apiData.TakedownAccuracy,
    tdDef: ufcStatsData?.tdDef || apiData.TakedownDefense,
    subAvg: ufcStatsData?.subAvg || apiData.SubmissionsPer15Minutes || apiData.SubmissionAverage,
    
    // Career totals
    totalSigStrikes: apiData.SignificantStrikesLanded,
    totalSigStrikesAttempted: apiData.SignificantStrikesAttempted,
    totalTakedowns: apiData.TakedownsLanded,
    totalTakedownsAttempted: apiData.TakedownsAttempted,
    totalSubmissionAttempts: apiData.SubmissionAttempts,
    totalKnockdowns: apiData.Knockdowns,
    avgFightTime: apiData.AverageFightTimeSeconds,
  };
}

export default {
  fetchUFCStatsProfile,
  fetchEventLocation,
  enrichFighterData,
};