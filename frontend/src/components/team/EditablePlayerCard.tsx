import React from 'react';
import { motion } from 'framer-motion';
import { X, Shirt, Star, User, ChevronsRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// --- ASSET IMPORTS ---
import tshirtRed from '@/assets/images/jerseys/tshirt-red.png';

const TEAM_JERSEYS = {
  'Satan': tshirtRed,
  // Add other teams...
};

interface EditablePlayerCardProps {
  player: any;
  onClose: () => void;
  onSubstitute: (player: any) => void;
}

const StatRow = ({ label, value, rank }) => (
    <div className="flex justify-between items-center py-2 text-sm">
        <p className="text-gray-600">{label}</p>
        <div className="flex items-center">
            <p className="font-bold w-12 text-center">{value}</p>
            <p className="text-xs text-gray-400 w-16 text-right">{rank}</p>
        </div>
    </div>
);

const FixtureRow = ({ gameweek, opponent, points }) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-200 text-sm">
        <p className="font-semibold">{gameweek}</p>
        <p className="text-gray-600">{opponent}</p>
        <p className="font-bold">{points} pts</p>
    </div>
);

export const EditablePlayerCard: React.FC<EditablePlayerCardProps> = ({ player, onClose, onSubstitute }) => {
  if (!player) return null;

  const jerseySrc = TEAM_JERSEYS[player.team] || tshirtRed;

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
        className="relative w-full max-w-sm bg-white rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="border-2 border-gray-300">
          <CardHeader className="bg-gray-100 p-4">
            <div className="flex items-center space-x-4">
                <img src={jerseySrc} alt={`${player.team} jersey`} className="w-16 h-auto" />
                <div>
                    <p className="text-xs text-gray-500 font-bold">{player.pos}</p>
                    <CardTitle className="text-2xl font-bold">{player.name}</CardTitle>
                    <p className="text-md font-semibold text-gray-700">{player.team}</p>
                </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div>
                    <p className="font-bold text-lg">£5.0m</p>
                    <p className="text-xs text-gray-500">Price</p>
                </div>
                 <div>
                    <p className="font-bold text-lg">9.0</p>
                    <p className="text-xs text-gray-500">Form</p>
                </div>
                 <div>
                    <p className="font-bold text-lg">4.0%</p>
                    <p className="text-xs text-gray-500">TSB %</p>
                </div>
            </div>
            
            <div>
                <h4 className="font-bold text-md mb-2">Fixtures</h4>
                <div className="space-y-1">
                    <FixtureRow gameweek="GW1" opponent="AVL (A)" points={9} />
                    <FixtureRow gameweek="GW2" opponent="LIV (H)" points={4} />
                    <FixtureRow gameweek="GW3" opponent="LEE (A)" points={2} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-6">
                <Button variant="outline"><Star className="w-4 h-4 mr-2"/>Captain</Button>
                <Button variant="outline"><Star className="w-4 h-4 mr-2"/>Vice-Captain</Button>
                <Button variant="outline" className="col-span-2"><User className="w-4 h-4 mr-2"/>Full Profile</Button>
                <Button variant="destructive" className="col-span-2" onClick={() => onSubstitute(player)}>
                    <ChevronsRight className="w-4 h-4 mr-2"/>Substitute
                </Button>
            </div>
          </CardContent>
          <button onClick={onClose} className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </Card>
      </motion.div>
    </motion.div>
  );
};
