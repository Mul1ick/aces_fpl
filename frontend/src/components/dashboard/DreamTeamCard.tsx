import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getTeamJersey } from '@/lib/player-utils';

interface DreamTeamCardProps {
  team: any;
  gameweekNumber: number;
}

export const DreamTeamCard: React.FC<DreamTeamCardProps> = ({ team, gameweekNumber }) => {
  const canView = team && team.points > 0;

  // Determine the subtitle text based on gameweek and data availability
  let subtitleText;
  if (canView) {
    subtitleText = `Game Week ${gameweekNumber}`;
  } else if (gameweekNumber <= 1) {
    subtitleText = "Available after Gameweek 1";
  } else {
    subtitleText = "Stats processing...";
  }

  return (
    <Card className="h-full border-black border-2 bg-white">
      <CardHeader>
        <Link
          to={canView ? `/dream-team/${gameweekNumber}` : '#'}
          className={`flex items-center justify-between group ${!canView && 'pointer-events-none'}`}
        >
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl group-hover:underline text-black">Team Of the Week</CardTitle>
          </div>
          {canView && <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />}
        </Link>
        <p className="text-sm text-gray-500 font-semibold">
          {subtitleText}
        </p>
      </CardHeader>
      <CardContent>
        {canView ? (
            <div className="space-y-3">
              {/* --- STARTERS (Best 8) --- */}
              <h4 className="font-bold text-gray-500 text-sm">Best VIII</h4>
              {team.starting.map((player: any) => (
                  <div key={player.id} className="flex items-center space-x-3 text-sm">
                    <img src={getTeamJersey(player.team?.name)} alt="jersey" className="w-6 h-8 object-contain"/>
                    <div className="flex-1">
                        <p className="font-bold text-black">
                        {player.full_name}
                        {player.is_captain && <span className="text-[13px] ml-1 font-extrabold text-black">(C)</span>}
                        {player.is_vice_captain && <span className="text-[13px] ml-1 font-bold text-gray-500">(VC)</span>}
                        </p>
                        <p className="text-xs text-gray-500">{player.team?.short_name} · {player.position}</p>
                    </div>
                    <p className="font-bold text-black tabular-nums">{player.points} pts</p>
                  </div>
              ))}

              {/* --- BENCH (The other 3) --- */}
              <h4 className="font-bold text-gray-500 text-sm pt-2 border-t border-gray-100">Bench</h4>
              {team.bench.map((player: any) => (
                  <div key={player.id} className="flex items-center space-x-3 text-sm opacity-75">
                    <img src={getTeamJersey(player.team?.name)} alt="jersey" className="w-6 h-8 object-contain"/>
                    <div className="flex-1">
                        <p className="font-bold text-black">{player.full_name}</p>
                        <p className="text-xs text-gray-500">{player.team?.short_name} · {player.position}</p>
                    </div>
                    <p className="font-bold text-black tabular-nums">{player.points} pts</p>
                  </div>
              ))}
            </div>
        ) : (
            <div className="space-y-3 text-center text-gray-400 pt-8 pb-8">
                Check back here after the gameweek is finalized.
            </div>
        )}
      </CardContent>
    </Card>
  );
};