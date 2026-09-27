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
  active_chip?: string | null; // Added to receive chip status from backend
}

interface TeamOfTheWeekCardProps {
  team: TeamOfTheWeek;
  gameweekNumber: number; 
}

export const TeamOfTheWeekCard: React.FC<TeamOfTheWeekCardProps> = ({ team, gameweekNumber }) => {
  const canViewTotw = gameweekNumber > 0 && !!team;
  const totwGameweekToShow = gameweekNumber;

  const { multiplier, effectiveCaptainId } = useMemo(() => {
    if (!team || !team.starting) return { multiplier: 2, effectiveCaptainId: null };

    const captain = team.starting.find((p: any) => p.is_captain || p.isCaptain);
    const vice = team.starting.find((p: any) => p.is_vice_captain || p.isVice);

    if (!captain) return { multiplier: 2, effectiveCaptainId: vice?.id ? Number(vice.id) : null };

    const stats = captain.stats || captain.raw_stats || {};
    const captainPlayed = stats.played === true;
    
    const effectiveCaptain = captainPlayed ? captain : vice;
    
    // STRICT CAST TO NUMBER to fix the equality bug
    const effId = effectiveCaptain?.id ? Number(effectiveCaptain.id) : null;

    // Use active_chip if provided, otherwise fallback to mathematical deduction
    let deducedMult = 2;
    if (team.active_chip === 'TRIPLE_CAPTAIN') {
      deducedMult = 3;
    } else if (effectiveCaptain && !team.active_chip) {
      const rawTotal = team.starting.reduce((sum: number, p: any) => sum + Number(p.points || 0), 0);
      const bonusPortion = Number(team.points) - rawTotal;
      if (Math.abs(bonusPortion - (Number(effectiveCaptain.points || 0) * 2)) < 0.1) {
        deducedMult = 3;
      }
    }

    return { multiplier: deducedMult, effectiveCaptainId: effId };
  }, [team]);

  return (
    <Card className="h-full border-black border-2 bg-white">
      <CardHeader>
        <Link
          to={canViewTotw ? `/team-of-the-week/${totwGameweekToShow}` : '#'}
          className={`flex items-center justify-between group ${!canViewTotw && 'pointer-events-none'}`}
        >
          <CardTitle className="text-xl group-hover:underline text-black">Manager of the Week</CardTitle>
          {canViewTotw && <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />}
        </Link>
        <p className="text-sm text-gray-500 font-semibold">
          {canViewTotw ? `${team.manager_name} - ${team.points} pts (GW${totwGameweekToShow})` : 'Available after Gameweek 1'}
        </p>
      </CardHeader>
      <CardContent>
        {canViewTotw ? (
          <div className="space-y-3">
            <h4 className="font-bold text-gray-500 text-sm">Starting VIII</h4>
            {team?.starting.map(player => {
              const isCaptain = player.is_captain || player.isCaptain;
              const isVice = player.is_vice_captain || player.isVice;
              
              // STRICT CAST TO NUMBER for equality check
              const isEffCap = Number(player.id) === effectiveCaptainId; 
              
              const displayPoints = (Number(player.points) || 0) * (isEffCap ? multiplier : 1);

              return (
                <div key={player.id} className="flex items-center space-x-3 text-sm">
                  <img src={getTeamJersey(player.team?.name || player.team)} alt="jersey" className="w-6 h-8 object-contain"/>
                  <div className="flex-1">
                    <p className="font-bold text-black">
                      {player.full_name || player.name}
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
                    <p className="text-xs text-gray-500">{player.team?.short_name || player.team} · {player.position || player.pos}</p>
                  </div>
                  <p className="font-bold text-black tabular-nums">{displayPoints} pts</p>
                </div>
              );
            })}
            
            <h4 className="font-bold text-gray-500 text-sm pt-2 border-t">Bench</h4>
            {team?.bench.map(player => (
              <div key={player.id} className="flex items-center space-x-3 text-sm opacity-75">
                <img src={getTeamJersey(player.team?.name || player.team)} alt="jersey" className="w-6 h-8 object-contain"/>
                <div className="flex-1">
                  <p className="font-bold text-black">{player.full_name || player.name}</p>
                  <p className="text-xs text-gray-500">{player.team?.short_name || player.team} · {player.position || player.pos}</p>
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