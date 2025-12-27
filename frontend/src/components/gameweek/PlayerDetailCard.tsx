import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTeamJersey } from '@/lib/player-utils';
import { ChipName } from '@/lib/api';

interface PlayerDetailCardProps {
  player: any;
  onClose: () => void;
  activeChip?: ChipName | null;
  isEffectiveCaptain?: boolean; // --- ADDED ---
}

export const PlayerDetailCard: React.FC<PlayerDetailCardProps> = ({ 
  player, 
  onClose, 
  activeChip,
  isEffectiveCaptain = false // --- ADDED ---
}) => {
  if (!player) return null;

  const jerseySrc = getTeamJersey(player.team?.name);

  // --- UPDATED LOGIC ---
  // Use the 'isEffectiveCaptain' prop to determine the multiplier
  const multiplier = isEffectiveCaptain
    ? (activeChip === 'TRIPLE_CAPTAIN' ? 3 : 2)
    : 1;

  const displayPoints = (player.points ?? 0) * multiplier;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="relative w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="border-2 border-gray-300 shadow-xl bg-white text-black">
          <CardHeader className="p-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-black">{player.name || player.full_name}</CardTitle>
              <p className="text-sm text-gray-500">vs. {player.fixture_str || '-'}</p>
            </div>
            <img src={jerseySrc} alt={`${player.team?.name} jersey`} className="w-12 h-auto" />
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="font-bold text-black">{player.team?.name || 'N/A'}</p>
                <p className="text-xs text-gray-500">{player.position}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-black">
                  {displayPoints} pts
                </p>
                {/* Visual indicator for the multiplier */}
                {multiplier > 1 && (
                  <p className="text-xs font-bold text-white bg-pl-purple px-2 py-0.5 rounded-full inline-block">
                    {activeChip === 'TRIPLE_CAPTAIN' ? 'Triple Captain' : 'Captain'} ({multiplier}x)
                  </p>
                )}
              </div>
            </div>
            
            <div>
                <h4 className="font-bold text-md mb-2 text-black">Points Breakdown</h4>
                {player?.breakdown && player.breakdown.length > 0 ? (
                  <div className="grid grid-cols-2 gap-y-1 text-sm">
                    {player.breakdown.map((row: any) => (
                      <div key={row.label} className="col-span-2 flex justify-between border-b border-gray-100 py-1 last:border-0">
                        <span className="text-gray-600">
                          {row.label}{typeof row.value === "number" ? ` (${row.value})` : ""}
                        </span>
                        <span className="font-medium text-black">{row.points}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No breakdown available.</p>
                )}
            </div>
          </CardContent>
          <button onClick={onClose} className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </Card>
      </motion.div>
    </motion.div>
  );
};