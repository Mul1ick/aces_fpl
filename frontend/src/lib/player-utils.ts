// frontend/src/lib/player-utils.ts

// --- JERSEYS ---
import aerTitansJersey from '@/assets/images/jerseys/aer-titans.png';
import casualsJersey from '@/assets/images/jerseys/casuals.png';
import cathectJersey from '@/assets/images/jerseys/cathect.png';
import encoreJersey from '@/assets/images/jerseys/encore.png';
import materoJersey from '@/assets/images/jerseys/matero.png';
import mrfcJersey from '@/assets/images/jerseys/mrfc.png';
import roarersJersey from '@/assets/images/jerseys/roarers.png';
import satansJersey from '@/assets/images/jerseys/satans.png';
import traanaJersey from '@/assets/images/jerseys/traana.png';
import umaagJersey from '@/assets/images/jerseys/umang.png';
import wolfpackJersey from '@/assets/images/jerseys/wolfpack.png';
import youngbloodJersey from '@/assets/images/jerseys/youngblood.png';
import tshirtWhite from '@/assets/images/jerseys/tshirt-white.png';

// Legacy jerseys (kept as fallbacks)
import southsideJersey from '@/assets/images/jerseys/southside.png';
import titansJersey from '@/assets/images/jerseys/titans.png';

// --- LOGOS ---
import aerTitansLogo from '@/assets/images/team-logos/aer-titans-logo.png';
import casualsLogo from '@/assets/images/team-logos/casuals-logo.png';
import cathectLogo from '@/assets/images/team-logos/cathect-logo.png';
import encoreLogo from '@/assets/images/team-logos/encore-logo.png';
import materoLogo from '@/assets/images/team-logos/matero-logo.png';
import mrfcLogo from '@/assets/images/team-logos/mrfc-logo.png';
import roarersLogo from '@/assets/images/team-logos/roarers-logo.png';
import satansLogo from '@/assets/images/team-logos/satans-logo.png';
import tranaLogo from '@/assets/images/team-logos/trana-logo.png';
import umangLogo from '@/assets/images/team-logos/umang-logo.png';
import wolfpackLogo from '@/assets/images/team-logos/wolfpack-logo.jpeg';
import youngbloodLogo from '@/assets/images/team-logos/youngblood-logo.png';

// Fallbacks
import defaultLogo from '@/assets/images/team-logos/yellow.png';


/**
 * Maps the FULL Team Name (from the database) to the jersey image.
 */
export const TEAM_JERSEYS: Record<string, string> = {
  'Umang': umaagJersey,
  'Satans': satansJersey,
  'Aer Titans': aerTitansJersey,
  'Trana': traanaJersey,
  'Roarers': roarersJersey,
  'Casuals FC': casualsJersey,
  'Cathect': cathectJersey,
  'Encore United': encoreJersey,
  'Matero Power 8s': materoJersey,
  'Wolfpack FC': wolfpackJersey,
  'Youngblood FC': youngbloodJersey,
  'Majithia Reality FC': mrfcJersey,
  // Fallbacks
  'Southside': southsideJersey,
  'Titans': titansJersey,
};


/**
 * Maps the SHORT Name (from the database) to the Logo image.
 */
export const TEAM_LOGOS: Record<string, string> = {
  'UMA': umangLogo,
  'SAT': satansLogo,
  'AER': aerTitansLogo,
  'TRA': tranaLogo,
  'ROA': roarersLogo,
  'CAS': casualsLogo,
  'CAT': cathectLogo,
  'ENC': encoreLogo,
  'MAT': materoLogo,
  'WOLF': wolfpackLogo,
  'YBFC': youngbloodLogo,
  'MRFC': mrfcLogo, 
};

export const getTeamLogo = (shortName: string | undefined): string => {
  if (!shortName) return defaultLogo;
  return TEAM_LOGOS[shortName.toUpperCase()] || defaultLogo;
};

/**
 * A helper function to safely get a jersey, with a default fallback.
 */
export const getTeamJersey = (teamName: string | undefined): string => {
  if (!teamName) return tshirtWhite;
  return TEAM_JERSEYS[teamName] || tshirtWhite;
};

/**
 * Transforms a raw player object from any API endpoint into a standardized
 * format that all frontend components can reliably use.
 */
export const transformApiPlayer = (rawPlayer: any): any => {
  if (!rawPlayer) return null;

  const position = String(rawPlayer.pos ?? rawPlayer.position ?? '').toUpperCase();
  const clubName = rawPlayer.team?.name || rawPlayer.club || 'Unknown';

  return {
    id: rawPlayer.id,
    name: rawPlayer.full_name ?? rawPlayer.name,
    fullName: rawPlayer.full_name,
    pos: position === 'ST' ? 'FWD' : position,
    position: position === 'ST' ? 'FWD' : position,
    club: clubName,
    teamName: clubName,
    team: clubName,
    price: rawPlayer.price,
    points: rawPlayer.points,
    tsb: rawPlayer.tsb, // Team Selected By %
    fixture: rawPlayer.fixture_str,
    isCaptain: rawPlayer.is_captain ?? rawPlayer.isCaptain ?? false,
    isVice: rawPlayer.is_vice_captain ?? rawPlayer.isVice ?? false,
    isBenched: rawPlayer.is_benched ?? rawPlayer.isBenched ?? false,
    
    status: rawPlayer.status ?? 'ACTIVE',
    news: rawPlayer.news ?? null,
    chance_of_playing: rawPlayer.chance_of_playing ?? null,
    return_date: rawPlayer.return_date ?? null,
    
    // Add the detailed stats from the API response
    recent_fixtures: rawPlayer.recent_fixtures ?? [],
    raw_stats: rawPlayer.raw_stats ?? {},
    breakdown: rawPlayer.breakdown ?? [],
  };
};