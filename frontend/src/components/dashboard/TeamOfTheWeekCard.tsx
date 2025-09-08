import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// --- ASSET IMPORTS ---
import tshirtRed from '@/assets/images/jerseys/tshirt-red.png';
import tshirtBlue from '@/assets/images/jerseys/tshirt-blue.png';
import tshirtWhite from '@/assets/images/jerseys/tshirt-white.png';
import tshirtBlack from '@/assets/images/jerseys/tshirt-black.png';
import tshirtNavy from '@/assets/images/jerseys/tshirt-navy.png';
import tshirtGreen from '@/assets/images/jerseys/tshirt-green.png';

const TEAM_JERSEYS = {
  'LIV': tshirtRed, 'TOT': tshirtWhite, 'AVL': tshirtNavy,
  'BRE': tshirtRed, 'ARS': tshirtRed, 'NEW': tshirtBlack,
  'CHE': tshirtBlue, 'MCI': tshirtBlue,
};

interface TeamOfTheWeek {
  manager: string;
  points: number;
  players: any[];
  bench: any[];
}

interface TeamOfTheWeekCardProps {
  team: TeamOfTheWeek;
}

export const TeamOfTheWeekCard: React.FC<TeamOfTheWeekCardProps> = ({ team }) => {
  return (
    <Card className="h-full border-black border-2">
      <CardHeader>
        <Link to="/team-of-the-week" className="flex items-center justify-between group">
            <CardTitle className="text-xl group-hover:underline">Team of the Week</CardTitle>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <h4 className="font-bold text-gray-500 text-sm">Starting XI</h4>
          {team.players.map(player => (
            <div key={player.id} className="flex items-center space-x-3 text-sm">
              <img src={TEAM_JERSEYS[player.club]} alt={`${player.club} jersey`} className="w-6 h-8 object-contain"/>
              <div className="flex-1">
                <p className="font-bold text-black">{player.name}</p>
                <p className="text-xs text-gray-500">{player.club} · {player.pos}</p>
              </div>
              <p className="font-bold text-black">{player.points} pts</p>
            </div>
          ))}
          <h4 className="font-bold text-gray-500 text-sm pt-2 border-t">Bench</h4>
          {team.bench.map(player => (
            <div key={player.id} className="flex items-center space-x-3 text-sm">
              <img src={TEAM_JERSEYS[player.club]} alt={`${player.club} jersey`} className="w-6 h-8 object-contain"/>
              <div className="flex-1">
                <p className="font-bold text-black">{player.name}</p>
                <p className="text-xs text-gray-500">{player.club} · {player.pos}</p>
              </div>
              <p className="font-bold text-black">{player.points} pts</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
