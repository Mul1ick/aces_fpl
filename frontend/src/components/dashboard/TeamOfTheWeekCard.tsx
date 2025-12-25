import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getTeamJersey } from '@/lib/player-utils';

interface TeamOfTheWeek {
  manager_name: string;
  points: number;
  starting: any[];
  bench: any[];
}

interface TeamOfTheWeekCardProps {
  team: TeamOfTheWeek;
  currentGameweekNumber: number;
}

export const TeamOfTheWeekCard: React.FC<TeamOfTheWeekCardProps> = ({ team, currentGameweekNumber }) => {
  const canViewTotw = currentGameweekNumber > 0;
  const totwGameweekToShow = currentGameweekNumber;

  // --- DEDUCE MULTIPLIER LOGIC ---
  const captainMultiplier = useMemo(() => {
    if (!team || !team.starting) return 2;

    const captain = team.starting.find((p: any) => p.is_captain || p.isCaptain);
    // If no captain or captain scored 0, we can't mathematically deduce, default to 2
    if (!captain || captain.points === 0) return 2; 

    // Sum of raw points from all starters
    const rawTotal = team.starting.reduce((sum: number, p: any) => sum + (p.points || 0), 0);
    
    // The difference between the Official Total and the Raw Sum represents the captain bonus
    const bonusPoints = team.points - rawTotal;
    
    // Standard Captain (2x): Bonus == CaptainPoints
    // Triple Captain (3x): Bonus == CaptainPoints * 2
    if (Math.abs(bonusPoints - (captain.points * 2)) < 0.1) {
      return 3;
    }
    
    return 2;
  }, [team]);

  return (
    <Card className="h-full border-black border-2">
      <CardHeader>
        <Link
          to={canViewTotw ? `/team-of-the-week/${totwGameweekToShow}` : '#'}
          className={`flex items-center justify-between group ${!canViewTotw && 'pointer-events-none'}`}
        >
          <CardTitle className="text-xl group-hover:underline">Team of the Week</CardTitle>
          {canViewTotw && <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />}
        </Link>
        <p className="text-sm text-gray-500 font-semibold">
          {canViewTotw ? `${team.manager_name} - ${team.points} pts (GW${totwGameweekToShow})` : 'Available after Gameweek 1'}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <h4 className="font-bold text-gray-500 text-sm">Starting XI</h4>
          {team.starting.map(player => {
            const isCaptain = player.is_captain || player.isCaptain;
            const isVice = player.is_vice_captain || player.isVice;
            
            // Apply the deduced multiplier
            const displayPoints = (player.points || 0) * (isCaptain ? captainMultiplier : 1);

            return (
              <div key={player.id} className="flex items-center space-x-3 text-sm">
                <img src={getTeamJersey(player.team.name)} alt={`${player.team.name} jersey`} className="w-6 h-8 object-contain"/>
                <div className="flex-1">
                  <p className="font-bold text-black">
                    {player.full_name}
                    {isCaptain && <span className="text-xs ml-1 text-pl-purple font-extrabold">(C)</span>}
                    {isVice && <span className="text-xs ml-1 text-gray-500 font-bold">(V)</span>}
                  </p>
                  <p className="text-xs text-gray-500">{player.team.short_name} · {player.position}</p>
                </div>
                <p className="font-bold text-black">{displayPoints} pts</p>
              </div>
            );
          })}
          <h4 className="font-bold text-gray-500 text-sm pt-2 border-t">Bench</h4>
          {team.bench.map(player => (
            <div key={player.id} className="flex items-center space-x-3 text-sm opacity-75">
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