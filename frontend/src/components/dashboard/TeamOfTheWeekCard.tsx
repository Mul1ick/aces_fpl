// frontend/src/components/dashboard/TeamOfTheWeekCard.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
// ✅ ADD THIS LINE
import { getTeamJersey } from '@/lib/player-utils';



interface TeamOfTheWeek {
  manager_name: string;
  points: number;
  starting: any[];
  bench: any[];
}

interface TeamOfTheWeekCardProps {
  team: TeamOfTheWeek;
  currentGameweekNumber: number; // Add this prop
}


export const TeamOfTheWeekCard: React.FC<TeamOfTheWeekCardProps> = ({ team, currentGameweekNumber }) => {

  const canViewTotw = currentGameweekNumber > 1;
  const totwGameweekToShow = currentGameweekNumber - 1;

  return (
    <Card className="h-full border-black border-2">
      <CardHeader>
        {/* --- MODIFIED: Use the prop to create a dynamic link --- */}
        <Link
          to={canViewTotw ? `/team-view/top/${totwGameweekToShow}` : '#'}
          className={`flex items-center justify-between group ${!canViewTotw && 'pointer-events-none'}`}
        >
          <CardTitle className="text-xl group-hover:underline">Team of the Week</CardTitle>
          {/* Only show the arrow if it's a clickable link */}
          {canViewTotw && <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />}
        </Link>
        <p className="text-sm text-gray-500 font-semibold">
          {/* Display which gameweek's TOTW it is */}
          {canViewTotw ? `${team.manager_name} - ${team.points} pts (GW${totwGameweekToShow})` : 'Available after Gameweek 1'}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <h4 className="font-bold text-gray-500 text-sm">Starting XI</h4>
          {team.starting.map(player => (
            <div key={player.id} className="flex items-center space-x-3 text-sm">
              <img src={getTeamJersey(player.team.name)} alt={`${player.team.name} jersey`} className="w-6 h-8 object-contain"/>
              <div className="flex-1">
                <p className="font-bold text-black">{player.full_name}</p>
               <p className="text-xs text-gray-500">{player.team.short_name} · {player.position}</p>
              </div>
              <p className="font-bold text-black">{player.points} pts</p>
            </div>
          ))}
          <h4 className="font-bold text-gray-500 text-sm pt-2 border-t">Bench</h4>
           {team.bench.map(player => (
            <div key={player.id} className="flex items-center space-x-3 text-sm">
              <img src={getTeamJersey(player.team.name)} alt={`${player.team.name} jersey`} className="w-6 h-8 object-contain"/>
              <div className="flex-1">
                <p className="font-bold text-black">{player.full_name}</p>
                <p className="text-xs text-gray-500">{player.team.short_name} · {player.position}</p>
              </div>
              <p className="font-bold text-black">{player.points} pts</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};