// frontend/src/lib/player-utils.ts

import tshirtRed from '@/assets/images/jerseys/tshirt-red.png';
import tshirtBlue from '@/assets/images/jerseys/tshirt-blue.png';
import tshirtWhite from '@/assets/images/jerseys/tshirt-white.png';
import tshirtBlack from '@/assets/images/jerseys/tshirt-black.png';
import tshirtNavy from '@/assets/images/jerseys/tshirt-navy.png';
import tshirtGreen from '@/assets/images/jerseys/tshirt-green.png';

/**
 * A complete and centralized mapping of team names to their jersey images.
 */
export const TEAM_JERSEYS: Record<string, string> = {
  'Satan': tshirtRed,
  'Bandra United': tshirtBlue,
  'Mumbai Hotspurs': tshirtWhite,
  'Southside': tshirtBlack,
  'Titans': tshirtNavy,
  'Umaag Foundation Trust': tshirtGreen,
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
  
  // This handles both structures: player.team.name OR player.club
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
    fixture: rawPlayer.fixture_str,
    isCaptain: rawPlayer.is_captain ?? rawPlayer.isCaptain ?? false,
    isVice: rawPlayer.is_vice_captain ?? rawPlayer.isVice ?? false,
    isBenched: rawPlayer.is_benched ?? rawPlayer.isBenched ?? false,
  };
};