import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import tshirtRed from '@/assets/images/jerseys/tshirt-red.png';
import tshirtBlue from '@/assets/images/jerseys/tshirt-blue.png';
import tshirtWhite from '@/assets/images/jerseys/tshirt-white.png';
import tshirtBlack from '@/assets/images/jerseys/tshirt-black.png';
import tshirtNavy from '@/assets/images/jerseys/tshirt-navy.png';
import tshirtGreen from '@/assets/images/jerseys/tshirt-green.png';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// A complete and centralized mapping of team names to their jersey images.
export const TEAM_JERSEYS: Record<string, string> = {
  'Satan': tshirtRed,
  'Bandra United': tshirtBlue,
  'Mumbai Hotspurs': tshirtWhite,
  'Southside': tshirtBlack,
  'Titans': tshirtNavy,
  'Umaag Foundation Trust': tshirtGreen,
  // Add any other teams here
};

// A helper function to safely get a jersey, with a default fallback.
export const getTeamJersey = (teamName: string) => {
  return TEAM_JERSEYS[teamName] || tshirtWhite; // Default to white if not found
};