// frontend/src/lib/player-utils.ts

import satansJersey from '@/assets/images/jerseys/satans.png';
import traanaJersey from '@/assets/images/jerseys/traana.png';
import roarersJersey from '@/assets/images/jerseys/roarers.png';
import southsideJersey from '@/assets/images/jerseys/southside.png';
import titansJersey from '@/assets/images/jerseys/titans.png';
import umaagJersey from '@/assets/images/jerseys/umang.png';
import tshirtWhite from '@/assets/images/jerseys/tshirt-white.png'

import umaLogo from '@/assets/images/team-logos/umang-logo.png';
import satansLogo from '@/assets/images/team-logos/satans-logo.png';
import roarersLogo from '@/assets/images/team-logos/roarers-logo.png';
import southsideLogo from '@/assets/images/team-logos/southside-logo.png';
import traanaLogo from '@/assets/images/team-logos/trana-logo.png';
import titansLogo from '@/assets/images/team-logos/titans-logo.png';
import defaultLogo from '@/assets/images/team-logos/yellow.png';


/**
 * A complete and centralized mapping of team names to their jersey images.
 */
export const TEAM_JERSEYS: Record<string, string> = {
  'Satans': satansJersey,
  'Roarers': roarersJersey,
  'Trana': traanaJersey, // CORRECTED: Key is now 'Trana'
  'Southside': southsideJersey,
  'Titans': titansJersey,
  'Umang': umaagJersey, // CORRECTED: Key is now 'Umang'
};


// Add this new mapping for logos (using short names as keys)
export const TEAM_LOGOS: Record<string, string> = {
  'UMA': umaLogo,
  'SAT': satansLogo,
  'ROA': roarersLogo,
  'SOU': southsideLogo,
  'TRA': traanaLogo,
  'TIT': titansLogo,
};

export const getTeamLogo = (shortName: string | undefined): string => {
  if (!shortName) return defaultLogo;
  return TEAM_LOGOS[shortName] || defaultLogo;
};
/**
 * A helper function to safely get a jersey, with a default fallback.
 * @param teamName The full name of the team.
 * @returns The path to the jersey image.
 */
export const getTeamJersey = (teamName: string | undefined): string => {
  if (!teamName) return tshirtWhite;
  return TEAM_JERSEYS[teamName] || tshirtWhite;
};

/**
 * Transforms a raw player object from any API endpoint into a standardized
 * format that all frontend components can reliably use.
 * @param rawPlayer The player object from the backend.
 * @returns A standardized player object for the UI.
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
    price: rawPlayer.price,
    points: rawPlayer.points,
    tsb: rawPlayer.tsb, // Team Selected By %
    fixture: rawPlayer.fixture_str,
    isCaptain: rawPlayer.is_captain ?? rawPlayer.isCaptain ?? false,
    isVice: rawPlayer.is_vice_captain ?? rawPlayer.isVice ?? false,
    isBenched: rawPlayer.is_benched ?? rawPlayer.isBenched ?? false,
    // Add the detailed stats from the API response
    recent_fixtures: rawPlayer.recent_fixtures ?? [],
    raw_stats: rawPlayer.raw_stats ?? {},
    breakdown: rawPlayer.breakdown ?? [],
  };
};