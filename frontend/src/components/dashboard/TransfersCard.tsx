import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, ArrowLeft } from 'lucide-react';

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

interface TransferPlayer {
  rank: number;
  name: string;
  club: string;
  pos: string;
  transfers: string;
}

interface TransfersCardProps {
  transfersIn: TransferPlayer[];
  transfersOut: TransferPlayer[];
}

export const TransfersCard: React.FC<TransfersCardProps> = ({ transfersIn, transfersOut }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card className="h-full border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl text-black">Most Transferred In</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transfersIn.map(player => (
              <div key={player.rank} className="flex items-center space-x-2">
                <span className="font-bold text-black">{player.rank}</span>
                <img src={TEAM_JERSEYS[player.club]} alt={`${player.club} jersey`} className="w-8 h-10 object-contain"/>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-black truncate">{player.name}</p>
                  <p className="text-xs text-gray-500 truncate">{player.club} · {player.pos}</p>
                </div>
                <div className="flex items-center">
                  <p className="font-semibold text-sm text-green-600">{player.transfers}</p>
                  <ArrowRight className="w-4 h-4 text-green-600 ml-1" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="h-full border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl text-black">Most Transferred Out</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transfersOut.map(player => (
              <div key={player.rank} className="flex items-center space-x-2">
                <span className="font-bold text-black">{player.rank}</span>
                <img src={TEAM_JERSEYS[player.club]} alt={`${player.club} jersey`} className="w-8 h-10 object-contain"/>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-black truncate">{player.name}</p>
                  <p className="text-xs text-gray-500 truncate">{player.club} · {player.pos}</p>
                </div>
                <div className="flex items-center">
                  <ArrowLeft className="w-4 h-4 text-red-500 mr-1" />
                  <p className="font-semibold text-sm text-red-500">{player.transfers}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
