import React from 'react';
import { cn } from '@/lib/utils';
import { Shield, Star } from 'lucide-react';

interface ListViewProps {
  players: any[];
}

export const ListView: React.FC<ListViewProps> = ({ players }) => {
  // Sort players by position: GK, DEF, MID, FWD, then Bench
  const sortedPlayers = [...players].sort((a, b) => {
    const positionOrder = { GK: 1, DEF: 2, MID: 3, FWD: 4 };
    if (a.is_benched && !b.is_benched) return 1;
    if (!a.is_benched && b.is_benched) return -1;
    return positionOrder[a.pos] - positionOrder[b.pos];
  });

  return (
    <div className="flex-1 p-4 min-h-0">
      <div className="bg-white rounded-lg shadow-md h-full overflow-auto">
        <table className="w-full text-left min-w-[300px]">
          <thead className="sticky top-0 bg-gray-100 z-10">
            <tr>
              <th className="p-3 text-xs font-bold text-gray-600 uppercase">Player</th>
              <th className="p-3 text-xs font-bold text-gray-600 uppercase text-right">GW Points</th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((player, index) => (
              <tr key={player.id} className={cn("border-b border-gray-200", player.is_benched ? "bg-gray-50 opacity-70" : "")}>
                <td className="p-3">
                  <div className="flex items-center space-x-2">
                     {player.isCaptain && <Star className="size-4 text-white fill-fpl-pink stroke-fpl-pink" />}
                     {player.isVice && <Shield className="size-4 text-white fill-gray-600 stroke-gray-600" />}
                    <div>
                        <p className="font-bold text-sm text-black">{player.name}</p>
                        <p className="text-xs text-gray-500">{player.team} • {player.pos}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-right font-bold text-lg text-black tabular-nums">
                  {player.points * (player.isCaptain ? 2 : 1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};