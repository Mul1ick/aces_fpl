import bluelockJersey from '@/assets/images/jerseys/bluelock.png';
import casualsJersey from '@/assets/images/jerseys/casuals.png';
import cathectJersey from '@/assets/images/jerseys/cathect.png';
import encoreJersey from '@/assets/images/jerseys/encore.png';
import falconsJersey from '@/assets/images/jerseys/falcons.png';
import hydrasJersey from '@/assets/images/jerseys/hydras.png';
import juggernautsJersey from '@/assets/images/jerseys/juggernauts.png';
import traanaJersey from '@/assets/images/jerseys/traana.png';
import umangJersey from '@/assets/images/jerseys/umang.png';
import wastedPotentialJersey from '@/assets/images/jerseys/wasted-potential.png';
import wolfpackJersey from '@/assets/images/jerseys/wolfpack.png';
import youngbloodJersey from '@/assets/images/jerseys/youngblood.png';
import tshirtWhite from '@/assets/images/jerseys/tshirt-white.png';

import southsideJersey from '@/assets/images/jerseys/southside.png';
import titansJersey from '@/assets/images/jerseys/titans.png';

// --- NEW SEASON LOGOS ---
import bluelockLogo from '@/assets/images/team-logos/bluelock-logo.png';
import casualsLogo from '@/assets/images/team-logos/casuals-logo.png';
import cathectLogo from '@/assets/images/team-logos/cathect-logo.png';
import encoreLogo from '@/assets/images/team-logos/encore-logo.png';
import falconsLogo from '@/assets/images/team-logos/falcons-logo.png';
import hydrasLogo from '@/assets/images/team-logos/hydras-logo.png';
import juggernautsLogo from '@/assets/images/team-logos/juggernauts-logo.png';
import tranaLogo from '@/assets/images/team-logos/trana-logo.png';
import umangLogo from '@/assets/images/team-logos/umang-logo.png';
import wastedPotentialLogo from '@/assets/images/team-logos/wasted-potential-logo.png';
import wolfpackLogo from '@/assets/images/team-logos/wolfpack-logo.png';
import youngbloodLogo from '@/assets/images/team-logos/youngblood-logo.png';

// Fallback
import defaultLogo from '@/assets/images/team-logos/yellow.png';

/**
 * Maps the FULL Team Name (from the database) to the jersey image.
 */
export const TEAM_JERSEYS: Record<string, string> = {
  'Wolfpack': wolfpackJersey,
  'Juggernauts': juggernautsJersey,
  'KT Falcons': falconsJersey,
  'Encore United': encoreJersey,
  'Hybec Hydras': hydrasJersey,
  'Umang FC': umangJersey,
  'Wasted Potential': wastedPotentialJersey,
  'Cathect FC': cathectJersey,
  'Youngblood FC': youngbloodJersey,
  'Trana': traanaJersey,
  'Bluelock': bluelockJersey,
  'Casuals FC': casualsJersey,
};


/**
 * Maps the SHORT Name (from the database) to the Logo image.
 */
export const TEAM_LOGOS: Record<string, string> = {
  'WOLF': wolfpackLogo,
  'JUG': juggernautsLogo,
  'FAL': falconsLogo,
  'ENC': encoreLogo,
  'HYD': hydrasLogo,
  'UMG': umangLogo,
  'WST': wastedPotentialLogo,
  'CTH': cathectLogo,
  'YBF': youngbloodLogo,
  'TRA': tranaLogo,
  'BLK': bluelockLogo,
  'CAS': casualsLogo,
};

export const getTeamLogo = (shortName: string | undefined): string => {
  if (!shortName) return defaultLogo;
  return TEAM_LOGOS[shortName.toUpperCase()] || defaultLogo;
};

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
  const clubName = rawPlayer.team?.name || rawPlayer.club || (typeof rawPlayer.team === 'string' ? rawPlayer.team : 'Unknown');
  const shortName = rawPlayer.team?.short_name || rawPlayer.team_short_name || (typeof clubName === 'string' ? clubName.substring(0,3).toUpperCase() : 'UNK');

  return {
    id: rawPlayer.id,
    name: rawPlayer.full_name ?? rawPlayer.name,
    fullName: rawPlayer.full_name,
    pos: position === 'ST' ? 'FWD' : position,
    position: position === 'ST' ? 'FWD' : position,
    club: clubName,
    teamName: clubName,
    team: clubName, // <--- FIXED: Now strictly a string!
    team_obj: typeof rawPlayer.team === 'object' ? rawPlayer.team : null, // <--- Safe object storage
    team_short_name: shortName,
    price: rawPlayer.price,
    points: rawPlayer.points,
    tsb: rawPlayer.tsb,
    fixture: rawPlayer.fixture_str,
    isCaptain: rawPlayer.is_captain ?? rawPlayer.isCaptain ?? false,
    isVice: rawPlayer.is_vice_captain ?? rawPlayer.isVice ?? false,
    isBenched: rawPlayer.is_benched ?? rawPlayer.isBenched ?? false,
    
    status: rawPlayer.status ?? 'ACTIVE',
    news: rawPlayer.news ?? null,
    chance_of_playing: rawPlayer.chance_of_playing ?? null,
    return_date: rawPlayer.return_date ?? null,
    
    recent_fixtures: rawPlayer.recent_fixtures ?? [],
    raw_stats: rawPlayer.raw_stats ?? {},
    breakdown: rawPlayer.breakdown ?? [],
  };
};