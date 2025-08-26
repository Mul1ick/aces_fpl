import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// --- ASSET IMPORTS ---
import tshirtRed from '@/assets/images/jerseys/tshirt-red.png';
import tshirtBlue from '@/assets/images/jerseys/tshirt-blue.png';
import tshirtWhite from '@/assets/images/jerseys/tshirt-white.png';
import tshirtBlack from '@/assets/images/jerseys/tshirt-black.png';
import tshirtNavy from '@/assets/images/jerseys/tshirt-navy.png';
import tshirtGreen from '@/assets/images/jerseys/tshirt-green.png';

// --- CONFIGURATION ---
const TEAM_JERSEYS = {
  'Satan': tshirtRed,
  'Mumbai Hotspurs': tshirtWhite,
  'Bandra United': tshirtBlue,
  'Southside': tshirtBlack,
  'Titans': tshirtNavy,
  'Umaag Foundation Trust': tshirtGreen,
};

// --- TYPESCRIPT INTERFACES ---
interface Player {
  id: number;
  name: string;
  team: string;
  pos: string;
  fixture: string;
  points: number;
  isCaptain?: boolean;
  isVice?: boolean;
}

interface PlayerCardProps {
  player: Player;
  isBench?: boolean;
}

// --- PLAYER CARD COMPONENT ---
const PlayerCard: React.FC<PlayerCardProps> = ({ player, isBench = false }) => {
  const jerseySrc = TEAM_JERSEYS[player.team] || tshirtWhite;
  const displayPoints = player.isCaptain ? player.points * 2 : player.isVice ? Math.floor(player.points * 1.5) : player.points;

  return (
    <motion.div 
      className="flex flex-col items-center text-center relative"
      style={{ width: isBench ? '70px' : '85px' }}
      whileHover={{ scale: 1.1, zIndex: 10 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className="w-full overflow-hidden shadow-lg border border-white/10 flex flex-col" style={{ height: isBench ? '90px' : '115px' }}>
        {/* Jersey Section */}
        <div className="relative h-[65%]">
          <img 
            src={jerseySrc} 
            alt={`${player.team} jersey`} 
            className="w-full h-full object-cover"
          />
          {(player.isCaptain || player.isVice) && (
            <div className={cn(
              "absolute top-0.5 left-0.5 rounded-full flex items-center justify-center font-bold text-white text-[10px] w-4 h-4 border border-black/50",
              player.isCaptain ? 'bg-[#FF2882]' : 'bg-gray-700'
            )}>
              {player.isCaptain ? 'C' : 'V'}
            </div>
          )}
        </div>
        
        {/* Info Section */}
        <div className="h-[35%] flex flex-col">
          {/* Player Name */}
          <div className="flex-1 bg-white text-black flex items-center justify-center px-1">
              <p className="font-bold truncate" style={{ fontSize: isBench ? '9px' : '11px' }}>{player.name}</p>
          </div>
          {/* Points */}
          <div className="flex-1 bg-[#23003F] text-white font-bold flex items-center justify-center">
            <p style={{ fontSize: isBench ? '11px' : '12px' }}>{displayPoints}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PlayerCard;
