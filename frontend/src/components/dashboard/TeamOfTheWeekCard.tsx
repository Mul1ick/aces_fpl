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

  // --- NEW LOGIC: Deduce Effective Captain and Multiplier ---
  const { multiplier, effectiveCaptainId } = useMemo(() => {
    if (!team || !team.starting) return { multiplier: 2, effectiveCaptainId: null };

    const captain = team.starting.find((p: any) => p.is_captain || p.isCaptain);
    const vice = team.starting.find((p: any) => p.is_vice_captain || p.isVice);

    // 1. Identify who actually played. 
    // We check stats.played or raw_stats.played (handles both API formats)
    const capPlayed = captain?.stats?.played || captain?.raw_stats?.played || false;
    
    // If Captain missed the game, the bonus target is the Vice-Captain
    const bonusTarget = capPlayed ? captain : vice;

    if (!bonusTarget || bonusTarget.points === 0) {
        return { multiplier: 2, effectiveCaptainId: bonusTarget?.id };
    }

    // 2. Deduce if it was a Triple Captain or standard Captain
    // Sum the raw points of all starters
    const rawTotal = team.starting.reduce((sum: number, p: any) => sum + (p.points || 0), 0);
    
    // The difference between Official Total and Raw Sum is the bonus
    const bonusPoints = team.points - rawTotal;
    
    // If bonus is 2x the player's points, it's a Triple Captain (Total = 1x base + 2x bonus)
    const deducedMultiplier = Math.abs(bonusPoints - (bonusTarget.points * 2)) < 0.1 ? 3 : 2;

    return { multiplier: deducedMultiplier, effectiveCaptainId: bonusTarget.id };
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
            
            // --- UPDATED: Use the deduced effective captain logic ---
            const isEffCap = player.id === effectiveCaptainId;
            const displayPoints = (player.points || 0) * (isEffCap ? multiplier : 1);

            return (
              <div key={player.id} className="flex items-center space-x-3 text-sm">
                <img src={getTeamJersey(player.team.name)} alt={`${player.team.name} jersey`} className="w-6 h-8 object-contain"/>
                <div className="flex-1">
                  <p className="font-bold text-black">
                    {player.full_name}
                    {isCaptain && (
                        <span className={`text-[10px] ml-1 font-extrabold ${isEffCap ? 'text-pl-purple' : 'text-gray-400 opacity-50'}`}>
                            (C){isEffCap && multiplier === 3 && ' TC'}
                        </span>
                    )}
                    {isVice && (
                        <span className={`text-[10px] ml-1 font-bold ${isEffCap ? 'text-pl-purple' : 'text-gray-400'}`}>
                            (V){isEffCap && multiplier === 3 && ' TC'}
                        </span>
                    )}
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