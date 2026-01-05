import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

const StatRow = ({ label, value }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-200">
    <p className="text-sm text-gray-600">{label}</p>
    <p className="font-bold text-sm">{value}</p>
  </div>
);

const LinkRow = ({ label }) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-200">
        <p className="text-sm text-gray-600">{label}</p>
        <ChevronRight className="w-4 h-4 text-gray-400" />
    </div>
);

interface ManagerHubCardProps {
  stats: {
    overall_points: number;
    gameweek_points: number;
    total_players: number;
    squad_value: number,
    in_the_bank: number,
    gameweek_transfers: number; // Added
    total_transfers: number;    // Added
    transfer_cost?: number; // <--- Optional (?) in case API misses it

  };
  // ✅ ADD THIS PROP
  overallRank?: number | null;
}


export const ManagerHubCard: React.FC<ManagerHubCardProps> = ({ stats, overallRank }) => {

  // ✅ THE CALCULATIONS (Imitating the Leaderboard)
  
  // 1. Get the hits (default to 0 if missing)
  const hits = stats.transfer_cost || 0;

  // 2. Calculate the "Net Score" (Raw Points - Hits)
  // This ensures that if you have 0 points and 4 hits, it shows -4.
  const netOverallPoints = stats.overall_points - hits;

  
  return (
    <Card className="h-full border-black border-2">
        <CardContent className="p-4">
            {/* Points & Rankings Section */}
            <div>
                <h3 className="font-bold text-lg mb-2">Points & Rankings</h3>
                <div className="space-y-1">
                    <StatRow label="Overall points" value={netOverallPoints} />
                    
                    {/* ✅ MODIFIED THIS LINE */}
                    <StatRow label="Overall rank" value={overallRank?.toLocaleString() ?? '...'} />
                    <StatRow label="Total players" value={stats.total_players.toLocaleString()} />
                    <StatRow label="Gameweek points" value={stats.gameweek_points} />
                    
                </div>
            </div>

            {/* Transfers Section */}
            <div className="mt-6">
                <h3 className="font-bold text-lg mb-2">Transfers</h3>
                <div className="space-y-1">
                    
                    <StatRow label="Total transfers" value={stats.total_transfers} />
                   
                </div>
            </div>

            {/* Finance Section */}
            <div className="mt-6">
                <h3 className="font-bold text-lg mb-2">Finance</h3>
                <div className="space-y-1">
                    <StatRow label="Squad value" value={`£${stats.squad_value.toFixed(1)}m`} />
                    <StatRow label="In the bank" value={`£${stats.in_the_bank.toFixed(1)}m`} />
                </div>
            </div>

          
        </CardContent>
    </Card>
  );
};