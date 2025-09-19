// frontend/src/components/layout/PlayerCard.tsx

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getTeamJersey } from '@/lib/player-utils';

// --- TYPESCRIPT INTERFACES ---
interface Player {
  id: number;
  name: string;
  team: string; // This will now be the full team name string
  pos: string;
  fixture?: string;
  points?: number;
  isCaptain?: boolean;
  isVice?: boolean;
}

interface PlayerCardProps {
  player: Player;
  isBench?: boolean;
  displayMode?: 'points' | 'fixture';
  showArmbands?: boolean;
}

// --- PLAYER CARD COMPONENT ---
const PlayerCard: React.FC<PlayerCardProps> = ({ player, isBench = false, displayMode = 'points', showArmbands = true }) => {
  const jerseySrc = getTeamJersey(player.team);

  const displayPoints = player.isCaptain 
    ? (player.points ?? 0) * 2 
    : player.points;

  return (
    <motion.div
      className="flex flex-col items-center text-center relative"
      style={{ width: isBench ? '65px' : '78px' }}
      whileHover={{ scale: 1.1, zIndex: 10 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className="w-full overflow-hidden shadow-lg border border-white/10 flex flex-col" style={{ height: isBench ? '85px' : '100px' }}>
        {/* Jersey Section */}
        <div className="relative h-[65%] p-0">
          <img
            src={jerseySrc}
            alt={`${player.team} jersey`}
            className="w-full h-full object-contain"
          />
          {showArmbands && (player.isCaptain || player.isVice) && (
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
          {/* Fixture or Points */}
          <div className={cn(
            "flex-1 font-bold flex items-center justify-center",
            displayMode === 'points' ? 'bg-[#23003F] text-white' : 'bg-white text-black'
          )}>
            <p style={{ fontSize: isBench ? '11px' : '12px' }}>
              {displayMode === 'points' ? displayPoints : (player.fixture || ' - ')}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PlayerCard;