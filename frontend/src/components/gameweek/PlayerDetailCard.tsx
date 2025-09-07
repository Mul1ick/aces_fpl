import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// --- ASSET IMPORTS ---
import tshirtRed from '@/assets/images/jerseys/tshirt-red.png';

const TEAM_JERSEYS = {
  'Satan': tshirtRed,
  // Add other teams...
};

interface PlayerDetailCardProps {
  player: any;
  onClose: () => void;
}

const StatRow = ({ label, value, points }) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-200 text-sm">
        <p className="text-gray-600">{label}</p>
        <div className="flex items-center">
            <p className="w-8 text-center text-black">{value}</p>
            <p className="font-bold w-12 text-right text-black">{points} pts</p>
        </div>
    </div>
);

export const PlayerDetailCard: React.FC<PlayerDetailCardProps> = ({ player, onClose }) => {
  if (!player) return null;

  const jerseySrc = TEAM_JERSEYS[player.team.name] || tshirtRed; // Correctly access team name for jersey

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
              <p className="text-sm text-gray-500">vs. {player.fixture}</p>
            </div>
            <img src={jerseySrc} alt={`${player.team.name} jersey`} className="w-12 h-auto" />
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                {/* Corrected this line to use player.team.name */}
                <p className="font-bold text-black">{player.team?.name || 'N/A'}</p>
                <p className="text-xs text-gray-500">Full Time</p>
              </div>
              <p className="text-3xl font-bold text-black">{player.points} pts</p>
            </div>
            
            <div>
                <h4 className="font-bold text-md mb-2 text-black">Points Breakdown</h4>
                <div className="space-y-1">
                    <StatRow label="Minutes played" value="90" points={2} />
                    <StatRow label="Clean sheets" value="1" points={4} />
                </div>
            </div>

            <Button className="w-full mt-6" variant="outline">
              View Full Profile
            </Button>
          </CardContent>
          <button onClick={onClose} className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </Card>
      </motion.div>
    </motion.div>
  );
};