import React from 'react';
import { cn } from '../../lib/utils';
import { ChipName } from '../../lib/api';

interface ListViewProps {
  players: any[];
  activeChip?: ChipName | null;
}

export const ListView: React.FC<ListViewProps> = ({ players, activeChip }) => {
  const starters = players.filter(p => !p.is_benched);
  const bench = players.filter(p => p.is_benched);

  const positionOrder: { [key: string]: number } = { GK: 1, DEF: 2, MID: 3, FWD: 4 };

  const sortedStarters = starters.sort((a, b) => positionOrder[a.position] - positionOrder[b.position]);
  const sortedBench = bench.sort((a, b) => positionOrder[a.position] - positionOrder[b.position]);


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
            {/* Render Starters */}
            {sortedStarters.map((player) => {
              const isCaptain = player.is_captain || player.isCaptain;
              const isViceCaptain = player.is_vice_captain || player.isVice;
              
              const multiplier = isCaptain
                ? (activeChip === 'TRIPLE_CAPTAIN' ? 3 : 2)
                : 1;
              const finalPoints = (player.points || 0) * multiplier;

              return (
                <tr key={player.id} className="border-b border-gray-200">
                  <td className="p-3">
                     <div className="flex items-center space-x-2">
                       <div>
                          <p className="font-bold text-sm text-black">
                            {player.full_name}
                            {isCaptain && <span className="font-semibold text-gray-600"> (C)</span>}
                            {isViceCaptain && <span className="font-semibold text-gray-600"> (VC)</span>}
                          </p>
                          <p className="text-xs text-gray-500">{player.team?.name || 'N/A'} • {player.position}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-right font-bold text-lg text-black tabular-nums">
                    {finalPoints}
                  </td>
                </tr>
              );
            })}

            <tr>
              <td colSpan={2} className="p-2 bg-gray-200 text-center font-bold text-xs text-gray-600 uppercase tracking-wider">
                Substitutes
              </td>
            </tr>

            {/* Render Bench */}
            {sortedBench.map((player) => (
              <tr key={player.id} className="border-b border-gray-200 bg-gray-50 opacity-80">
                <td className="p-3">
                   <div className="flex items-center space-x-2">
                     <div>
                        <p className="font-bold text-sm text-black">{player.full_name}</p>
                        <p className="text-xs text-gray-500">{player.team?.name || 'N/A'} • {player.position}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-right font-bold text-lg text-black tabular-nums">
                  {player.points}
                </td>
              </tr>
            ))}
          </tbody>
         </table>
      </div>
    </div>
  );
};
