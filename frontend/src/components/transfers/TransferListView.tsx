import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- ASSET IMPORTS ---
import tshirtRed from '@/assets/images/jerseys/tshirt-red.png';
import tshirtBlue from '@/assets/images/jerseys/tshirt-blue.png';
import tshirtWhite from '@/assets/images/jerseys/tshirt-white.png';
import tshirtBlack from '@/assets/images/jerseys/tshirt-black.png';
import tshirtNavy from '@/assets/images/jerseys/tshirt-navy.png';
import tshirtGreen from '@/assets/images/jerseys/tshirt-green.png';

const TEAM_JERSEYS = {
  'Satan': tshirtRed,
  'Bandra United': tshirtBlue,
  'Mumbai Hotspurs': tshirtWhite,
  'Southside': tshirtBlack,
  'Titans': tshirtNavy,
  'Umaag Foundation Trust': tshirtGreen,
};

interface TransferListViewProps {
  squad: {
    GK: any[],
    DEF: any[],
    MID: any[],
    FWD: any[],
  };
  onPlayerRemove: (position: string, index: number) => void;
}

export const TransferListView: React.FC<TransferListViewProps> = ({ squad, onPlayerRemove }) => {
  const allPlayers = Object.entries(squad).flatMap(([pos, players]) => 
    players.map((player, index) => player ? { ...player, pos, originalIndex: index } : null)
  ).filter(Boolean);

  const starters = allPlayers.filter(p => !p.is_benched);
  const bench = allPlayers.filter(p => p.is_benched);

  const positionOrder = { GK: 1, DEF: 2, MID: 3, FWD: 4 };
  
  const sortedStarters = starters.sort((a, b) => positionOrder[a.pos] - positionOrder[b.pos]);
  const sortedBench = bench.sort((a, b) => positionOrder[a.pos] - positionOrder[b.pos]);

  const PlayerRow = ({ player }) => (
    <tr className={cn("border-b border-gray-200", player.is_benched && "bg-gray-50 opacity-80")}>
      <td className="p-3">
        <div className="flex items-center space-x-3">
          <img src={TEAM_JERSEYS[player.club] || tshirtWhite} alt="jersey" className="w-8 h-10 object-contain" />
          <div>
            <p className="font-bold text-sm">{player.name}</p>
            <p className="text-xs text-gray-500">{player.pos} · {player.club}</p>
          </div>
        </div>
      </td>
      <td className="p-3 text-right font-bold text-sm">£{player.price.toFixed(1)}m</td>
      <td className="p-3 text-right">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onPlayerRemove(player.pos, player.originalIndex)}
        >
          <X className="w-4 h-4 mr-1" />
          Remove
        </Button>
      </td>
    </tr>
  );

  return (
    <div className="bg-white rounded-lg shadow-md h-full overflow-auto">
      <table className="w-full text-left min-w-[300px]">
        <thead className="sticky top-0 bg-gray-100 z-10">
          <tr>
            <th className="p-3 text-xs font-bold text-gray-600 uppercase">Player</th>
            <th className="p-3 text-xs font-bold text-gray-600 uppercase text-right">Price</th>
            <th className="p-3 text-xs font-bold text-gray-600 uppercase text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {sortedStarters.map(player => <PlayerRow key={player.id} player={player} />)}

          {sortedBench.length > 0 && (
            <tr>
              <td colSpan={3} className="p-2 bg-gray-200 text-center font-bold text-xs text-gray-600 uppercase tracking-wider">
                Substitutes
              </td>
            </tr>
          )}

          {sortedBench.map(player => <PlayerRow key={player.id} player={player} />)}
        </tbody>
      </table>
    </div>
  );
};