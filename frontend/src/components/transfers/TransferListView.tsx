import React from 'react';
import { cn } from '@/lib/utils';
// --- MODIFIED: Import the correct, centralized jersey helper ---
import { getTeamJersey } from '@/lib/player-utils';

interface TransferListViewProps {
  squad: {
    GK: any[],
    DEF: any[],
    MID: any[],
    FWD: any[],
  };
}

export const TransferListView: React.FC<TransferListViewProps> = ({ squad }) => {
  const allPlayers = Object.entries(squad).flatMap(([pos, players]) => 
    players.map((player) => player ? { ...player, pos } : null)
  ).filter(Boolean);

  const starters = allPlayers.filter(p => !p.is_benched);
  const bench = allPlayers.filter(p => p.is_benched);

  const positionOrder = { GK: 1, DEF: 2, MID: 3, FWD: 4 };
  
  const sortedStarters = starters.sort((a, b) => positionOrder[a.pos] - positionOrder[b.pos]);
  const sortedBench = bench.sort((a, b) => positionOrder[a.pos] - positionOrder[b.pos]);

  const PlayerRow = ({ player }: { player: any }) => (
    <tr className={cn("border-b border-gray-200", player.is_benched && "bg-gray-50 opacity-80")}>
      <td className="p-3">
        <div className="flex items-center space-x-3">
          {/* --- MODIFIED: Use the correct property 'player.teamName' --- */}
          <img src={getTeamJersey(player.teamName)} alt="jersey" className="w-8 h-10 object-contain" />
          <div>
            <p className="font-bold text-sm">{player.full_name}</p>
            {/* --- MODIFIED: Use the correct property 'player.teamName' --- */}
            <p className="text-xs text-gray-500">{player.pos} · {player.teamName}</p>
          </div>
        </div>
      </td>
      <td className="p-3 text-center font-bold text-sm">£{player.price.toFixed(1)}m</td>
      <td className="p-3 text-center text-xs font-semibold text-gray-600">{player.fixture_str || '—'}</td>
    </tr>
  );

  return (
    <div className="bg-white rounded-lg shadow-md h-full overflow-auto">
      <table className="w-full text-left min-w-[300px]">
        <thead className="sticky top-0 bg-gray-100 z-10">
          <tr>
            <th className="p-3 text-xs font-bold text-gray-600 uppercase">Player</th>
            <th className="p-3 text-xs font-bold text-gray-600 uppercase text-center">Price</th>
            <th className="p-3 text-xs font-bold text-gray-600 uppercase text-center">Next Fixture</th>
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