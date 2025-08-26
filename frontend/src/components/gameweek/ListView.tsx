import React from 'react';
import { cn } from '@/lib/utils';

interface ListViewProps {
  players: any[];
}

export const ListView: React.FC<ListViewProps> = ({ players }) => {
  return (
    <div className="flex-1 p-4 min-h-0">
      <div className="bg-white rounded-lg shadow-md h-full overflow-auto">
        <table className="w-full text-left min-w-[600px]">
          <thead className="sticky top-0 bg-gray-100 z-10">
            <tr>
              <th className="p-3 text-xs font-bold text-gray-600 uppercase">Player</th>
              <th className="p-3 text-xs font-bold text-gray-600 uppercase text-center">MP</th>
              <th className="p-3 text-xs font-bold text-gray-600 uppercase text-center">G</th>
              <th className="p-3 text-xs font-bold text-gray-600 uppercase text-center">A</th>
              <th className="p-3 text-xs font-bold text-gray-600 uppercase text-center">CS</th>
              <th className="p-3 text-xs font-bold text-gray-600 uppercase text-center">PPG</th>
              <th className="p-3 text-xs font-bold text-gray-600 uppercase text-right">GW Points</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, index) => (
              <tr key={player.id} className={cn("border-b border-gray-200", index % 2 === 1 && "bg-gray-50")}>
                <td className="p-3">
                  <p className="font-bold text-sm text-black">{player.name}</p>
                  <p className="text-xs text-gray-500">{player.team} · {player.fixture}</p>
                </td>
                <td className="p-3 text-center font-semibold text-gray-700">{player.matchesPlayed}</td>
                <td className="p-3 text-center font-semibold text-gray-700">{player.goals}</td>
                <td className="p-3 text-center font-semibold text-gray-700">{player.assists}</td>
                <td className="p-3 text-center font-semibold text-gray-700">{player.cleansheets}</td>
                <td className="p-3 text-center font-semibold text-gray-700">{player.ppg}</td>
                <td className="p-3 text-right font-bold text-lg text-black">
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
