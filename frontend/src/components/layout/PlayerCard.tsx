import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { getTeamJersey } from '../../lib/player-utils';
import { ChipName } from '../../lib/api';

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
  status?: 'ACTIVE' | 'INJURED' | 'SUSPENDED' | 'UNAVAILABLE';
  chance_of_playing?: number | null; // --- ADDED ---
  news?: string | null;
}

interface PlayerCardProps {
  player: Player;
  isBench?: boolean;
  displayMode?: 'points' | 'fixture';
  showArmbands?: boolean;
  activeChip?: ChipName | null;
  isEffectiveCaptain?: boolean;
}

// --- PLAYER CARD COMPONENT ---
const PlayerCard: React.FC<PlayerCardProps> = ({ 
  player, 
  isBench = false, 
  displayMode = 'points', 
  showArmbands = true, 
  activeChip,
  isEffectiveCaptain = false 
}) => {
  const jerseySrc = getTeamJersey(player.team);

  // Maintain compatibility with both naming conventions from the API
  const isCaptain = player.isCaptain || (player as any).is_captain;
  const isViceCaptain = player.isVice || (player as any).is_vice_captain;

  // If this player is the "Effective Captain" (The one receiving the bonus),
  // check for Triple Captain chip (3x) or default to standard Captain (2x).
  const multiplier = isEffectiveCaptain
    ? (activeChip === 'TRIPLE_CAPTAIN' ? 3 : 2)
    : 1;

  const displayPoints = (player.points ?? 0) * multiplier;
  
  // --- NEW STATUS COLOR LOGIC ---
  const getStatusColorClass = () => {
    const chance = player.chance_of_playing;
    const status = player.status;

    // 1. Strictly check if they are perfectly healthy first
    if (!status || status === 'ACTIVE') {
      return 'bg-white text-black';
    }
    
    // 2. Check if Doubtful (Yellow Warning)
    if (chance !== undefined && chance !== null && chance > 0 && chance <= 75) {
      return 'bg-yellow-400 text-black';
    }

    // 3. Otherwise, they are Ruled Out / Suspended / Unavailable (Red Warning)
    return 'bg-[#B2002D] text-white';
  };

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
          {showArmbands && (isCaptain || isViceCaptain) && (
            <div className={cn(
              "absolute top-0.5 left-0.5 rounded-full flex items-center justify-center font-bold text-white text-[10px] w-4 h-4 border border-black/50",
              isCaptain ? 'bg-[#FF2882]' : 'bg-gray-700'
            )}>
               {isCaptain ? 'C' : 'V'}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="h-[35%] flex flex-col">
          {/* Player Name */}
           <div className={cn(
             "flex-1 flex items-center justify-center px-1",
             getStatusColorClass() // --- APPLIED NEW LOGIC ---
           )}>
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