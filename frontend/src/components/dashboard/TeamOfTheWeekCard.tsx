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

  // --- NEW ROBUST LOGIC: Deduce Effective Captain and Multiplier ---
  // --- NEW ROBUST LOGIC: Deduce Effective Captain and Multiplier ---
// --- NEW ROBUST LOGIC: Mathematical Deduction of Captain ---
  const { multiplier, effectiveCaptainId } = useMemo(() => {
    if (!team || !team.starting) return { multiplier: 2, effectiveCaptainId: null };

    const captain = team.starting.find((p: any) => p.is_captain || p.isCaptain);
    const vice = team.starting.find((p: any) => p.is_vice_captain || p.isVice);

    if (!captain) return { multiplier: 2, effectiveCaptainId: vice?.id };

    // 1. Calculate the exact amount of bonus points added by the multiplier
    const rawTotal = team.starting.reduce((sum: number, p: any) => sum + Number(p.points || 0), 0);
    const bonusPortion = Number(team.points) - rawTotal;

    // 2. If the bonus portion is 0, it means the Captain scored 0 and kept the armband
    // (Or neither played. In both cases, visually keep the armband on the Captain).
    if (bonusPortion === 0) {
        return { multiplier: 2, effectiveCaptainId: captain.id };
    }

    const capPoints = Number(captain.points || 0);
    const vicePoints = Number(vice?.points || 0);

    // 3. Did the Captain provide the bonus? (Checks for 2x and 3x)
    if (bonusPortion === capPoints || bonusPortion === capPoints * 2) {
        const mult = bonusPortion === capPoints * 2 ? 3 : 2;
        return { multiplier: mult, effectiveCaptainId: captain.id };
    }

    // 4. Did the Vice Captain provide the bonus? (Checks for 2x and 3x)
    if (vice && (bonusPortion === vicePoints || bonusPortion === vicePoints * 2)) {
        const mult = bonusPortion === vicePoints * 2 ? 3 : 2;
        return { multiplier: mult, effectiveCaptainId: vice.id };
    }

    // 5. Absolute Fallback just in case admin manually altered total scores
    const checkPlayed = (p: any) => {
        if (!p) return false;
        if (Number(p.points) !== 0) return true;
        const stats = p.stats || p.raw_stats || p;
        return (
            (Number(stats?.goals_scored) > 0) || (Number(stats?.assists) > 0) ||
            (Number(stats?.yellow_cards) > 0) || (Number(stats?.red_cards) > 0) ||
            (Number(stats?.bonus_points) > 0) || (Number(stats?.goals_conceded) > 0) ||
            (Number(stats?.own_goals) > 0) || (Number(stats?.penalties_missed) > 0) ||
            (Number(stats?.penalties_saved) > 0) ||
            (stats?.clean_sheets === true || stats?.clean_sheets === 1 || stats?.clean_sheets === "true") ||
            (stats?.played === true || stats?.played === 1 || stats?.played === "true")
        );
    };

    const capPlayed = checkPlayed(captain);
    const bonusTarget = capPlayed ? captain : vice;
    const deducedMult = Math.abs(bonusPortion - (Number(bonusTarget?.points || 0) * 2)) < 0.1 ? 3 : 2;

    return { multiplier: deducedMult, effectiveCaptainId: bonusTarget?.id };
  }, [team]);
  return (
    <Card className="h-full border-black border-2">
      <CardHeader>
        <Link
          to={canViewTotw ? `/team-of-the-week/${totwGameweekToShow}` : '#'}
          className={`flex items-center justify-between group ${!canViewTotw && 'pointer-events-none'}`}
        >
          <CardTitle className="text-xl group-hover:underline">Manager of the Week</CardTitle>
          {canViewTotw && <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />}
        </Link>
        <p className="text-sm text-gray-500 font-semibold">
          {canViewTotw ? `${team.manager_name} - ${team.points} pts (GW${totwGameweekToShow})` : 'Available after Gameweek 1'}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <h4 className="font-bold text-gray-500 text-sm">Starting VIII</h4>
          {team.starting.map(player => {
            const isCaptain = player.is_captain || player.isCaptain;
            const isVice = player.is_vice_captain || player.isVice;
            
            // Apply the deduced multiplier only to the player who actually holds the armband
            const isEffCap = player.id === effectiveCaptainId;
            const displayPoints = (player.points || 0) * (isEffCap ? multiplier : 1);

            return (
              <div key={player.id} className="flex items-center space-x-3 text-sm">
                <img src={getTeamJersey(player.team?.name)} alt={`${player.team?.name} jersey`} className="w-6 h-8 object-contain"/>
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
                  <p className="text-xs text-gray-500">{player.team?.short_name} · {player.position}</p>
                </div>
                <p className="font-bold text-black tabular-nums">{displayPoints} pts</p>
              </div>
            );
          })}
          
          <h4 className="font-bold text-gray-500 text-sm pt-2 border-t">Bench</h4>
          {team.bench.map(player => (
            <div key={player.id} className="flex items-center space-x-3 text-sm opacity-75">
              <img src={getTeamJersey(player.team?.name)} alt={`${player.team?.name} jersey`} className="w-6 h-8 object-contain"/>
              <div className="flex-1">
                <p className="font-bold text-black">{player.full_name || player.name}</p>
                <p className="text-xs text-gray-500">{player.team?.short_name} · {player.position}</p>
              </div>
              <p className="font-bold text-black tabular-nums">{player.points} pts</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};