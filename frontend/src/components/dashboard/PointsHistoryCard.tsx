import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PointsHistory {
  gw: number;
  points: number;
  rank: string;
}

interface PointsHistoryCardProps {
  history: PointsHistory[];
}

export const PointsHistoryCard: React.FC<PointsHistoryCardProps> = ({ history }) => {
  return (
    <Card className="h-full border-gray-200">
      <CardHeader>
        <CardTitle className="text-xl">Points History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map(gw => (
            <div key={gw.gw} className="flex justify-between items-center">
              <p className="font-semibold text-gray-500">Gameweek {gw.gw}</p>
              <div className="text-right">
                <p className="font-bold">{gw.points} pts</p>
                <p className="text-xs text-gray-500">Rank: {gw.rank}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
