import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import satansJersey from '@/assets/images/jerseys/satans.png';
import traanaJersey from '@/assets/images/jerseys/traana.png';
import roarersJersey from '@/assets/images/jerseys/roarers.png';
import southsideJersey from '@/assets/images/jerseys/southside.png';
import titansJersey from '@/assets/images/jerseys/titans.png';
import umaagJersey from '@/assets/images/jerseys/umang.png';
import tshirtWhite from '@/assets/images/jerseys/tshirt-white.png'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


// A helper function to safely get a jersey, with a default fallback.