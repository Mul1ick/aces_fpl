import React from 'react';
import { getTeamJersey } from '@/lib/player-utils';
import { Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Player {
  id: number;
  full_name: string;
  position: string;
  points: number;
  team: { name: string; short_name: string };
  is_captain: boolean;
}

interface TeamOfTheSeasonStripProps {
  team: {
    points: number;
    starting: Player[];
  } | null;
}

export const TeamOfTheSeasonStrip: React.FC<TeamOfTheSeasonStripProps> = ({ team }) => {
  // --- Render a Placeholder state if team is null ---
  if (!team || !team.starting || team.starting.length === 0) {
    return (
      <div className="w-full mt-8 mb-8 max-w-7xl mx-auto px-4 sm:px-6">
        <Card className="border-black border-2 bg-white shadow-sm w-full">
          <CardHeader className="pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-black" />
              <CardTitle className="text-xl text-black">Team of the Season</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-8 text-center">
            <p className="text-gray-400 font-semibold text-sm">
              The Team of the Season will be displayed here once the season begins and players start earning points. Stay tuned for the top performers!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Sort by position order: GK -> DEF -> MID -> FWD
  const positionOrder: Record<string, number> = { GK: 1, DEF: 2, MID: 3, FWD: 4 };
  const sortedPlayers = [...team.starting].sort((a, b) => 
    (positionOrder[a.position] || 99) - (positionOrder[b.position] || 99)
  );

  return (
    <div className="w-full mt-8 mb-8">
      {/* --- HEADER (Constrained to align with the rest of the dashboard) --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black rounded-lg shadow-md">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-black leading-none">Team of the Season</h2>
              <p className="text-sm text-gray-500 font-bold mt-1 uppercase tracking-wide">Total: {team.points} pts</p>
            </div>
          </div>
        </div>
      </div>

      {/* --- CAROUSEL / GRID CONTAINER (Full screen width) --- */}
      <div 
        className="flex overflow-x-auto px-4 sm:px-6 pb-6 gap-3 sm:gap-4 snap-x snap-mandatory scroll-smooth lg:justify-center lg:overflow-visible lg:pb-0 lg:px-4" 
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {sortedPlayers.map((player) => (
          <div 
            key={player.id} 
            // Removed lg:w-full and restored the fixed width so they don't stretch weirdly in flex
            className="snap-center flex-shrink-0 w-32 sm:w-36 bg-black text-white rounded-xl overflow-hidden shadow-xl border-2 border-black relative group transition-transform hover:-translate-y-1 duration-300"
          >
            {/* Card Body */}
            <div className="p-3 flex flex-col items-center justify-center h-36 relative bg-gradient-to-b from-gray-900 to-black">
               {/* Jersey */}
               <img 
                src={getTeamJersey(player.team.name)} 
                alt={player.team.name} 
                className="w-14 h-16 sm:w-16 sm:h-20 object-contain drop-shadow-[0_4px_6px_rgba(255,255,255,0.15)] transform group-hover:scale-110 transition-transform duration-300"
               />
              
              {/* Captain Badge */}
              {player.is_captain && (
                <div className="absolute top-2 right-2 bg-white text-black text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-sm z-10">
                   C
                </div>
              )}

              {/* Player Name */}
              <div className="mt-3 text-center w-full relative z-10 px-1">
                <p className="text-[11px] sm:text-xs font-bold truncate leading-tight text-white">
                  {player.full_name}
                </p>
              </div>
            </div>

            {/* Footer Strip */}
            <div className="bg-white p-2 flex justify-between items-center text-[10px] font-bold border-t border-white/10">
              <span className="uppercase tracking-wider text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">{player.position}</span>
              <span className="text-black text-xs">{player.points} pts</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};