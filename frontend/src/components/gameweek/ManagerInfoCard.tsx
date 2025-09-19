import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// --- Helper Components ---

const StatRow = ({ label, value }) => (
  <div className="flex justify-between items-center py-2">
    <p className="text-sm text-gray-600">{label}</p>
    <p className="font-bold text-sm">{value}</p>
  </div>
);

const LinkRow = ({ label }) => (
    <div className="flex justify-between items-center py-2 cursor-pointer hover:bg-gray-50">
       <p className="text-sm text-gray-600">{label}</p>
        <ChevronRight className="w-4 h-4 text-gray-400" />
    </div>
);

const ManagerInfoCardSkeleton: React.FC = () => (
    <Card className="border-gray-300 border-2 h-full">
        <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="border-b border-gray-200"></div>
            <div className="space-y-2">
                <Skeleton className="h-6 w-1/3 mb-2" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
            </div>
            <div className="border-b border-gray-200"></div>
             <div className="space-y-2">
                <Skeleton className="h-6 w-1/3 mb-2" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
            </div>
        </CardContent>
    </Card>
);

// --- PROPS INTERFACE ---

interface LeaderboardEntry {
  rank: number;
  team_name: string;
  manager_email: string;
  total_points: number;
}

interface ManagerInfoCardProps {
  isLoading?: boolean;
  teamName?: string;
  managerName?: string;
  stats?: {
    overall_points: number;
    total_players: number;
    gameweek_points: number;
    squad_value: number;
    in_the_bank: number;
  };
  leagueStandings?: LeaderboardEntry[];
  overallRank?: number;
  currentUserEmail?: string;
}

// --- MAIN COMPONENT ---

export const ManagerInfoCard: React.FC<ManagerInfoCardProps> = ({
    isLoading,
    teamName,
    managerName,
    stats,
    leagueStandings,
    overallRank,
    currentUserEmail
}) => {
    if (isLoading) {
        return <ManagerInfoCardSkeleton />;
    }

    return (
     <Card className="border-gray-300 border-2 h-full">
        <CardContent className="p-4">
            <div className="text-left mb-4">
                <h2 className="text-3xl font-extrabold">{teamName || 'Your Team'}</h2>
                <p className="text-sm text-gray-500">{managerName || 'Your Name'}</p>
            </div>
             <div className="border-b border-gray-200 my-4"></div>

            {/* Points & Rankings Section */}
            <div>
                <h3 className="font-bold text-lg mb-2">Points & Rankings</h3>
                <div className="space-y-1">
                     <StatRow label="Overall points" value={stats?.overall_points.toLocaleString() ?? '...'} />
                    <StatRow label="Overall rank" value={overallRank?.toLocaleString() ?? '...'} />
                    <StatRow label="Total players" value={stats?.total_players.toLocaleString() ?? '...'} />
                    <StatRow label="Gameweek points" value={stats?.gameweek_points.toLocaleString() ?? '...'} />
                    
                </div>
            </div>
            <div className="border-b border-gray-200 my-4"></div>

            {/* League Table */}
             <div>
                <h3 className="font-bold text-lg mb-2">League Standing</h3>
                <div className="space-y-2">
                    {leagueStandings?.map(team => (
                         <div key={team.rank} className={`flex items-center justify-between text-sm p-1 rounded ${team.manager_email === currentUserEmail ? 'bg-green-100' : ''}`}>
                            <div className="flex items-center">
                                <span className="font-bold text-gray-500 w-6">{team.rank}</span>
                                <p className="font-semibold">{team.team_name}</p>
                            </div>
                            <p className="font-bold">{team.total_points}</p>
                         </div>
                    ))}
                </div>
            </div>
            <div className="border-b border-gray-200 my-4"></div>

            {/* Transfers Section */}
            <div>
                <h3 className="font-bold text-lg mb-2">Transfers</h3>
                <div className="space-y-1">
                    <StatRow label="Gameweek transfers" value="0" />
                    <StatRow label="Total transfers" value="0" />
                    
                </div>
            </div>
             <div className="border-b border-gray-200 my-4"></div>

            {/* Finance Section */}
            <div>
                <h3 className="font-bold text-lg mb-2">Finance</h3>
                <div className="space-y-1">
                     <StatRow label="Squad value" value={`£${stats?.squad_value.toFixed(1) ?? '0.0'}m`} />
                    <StatRow label="In the bank" value={`£${stats?.in_the_bank.toFixed(1) ?? '0.0'}m`} />
                </div>
            </div>
            <div className="border-b border-gray-200 my-4"></div>

            
        </CardContent>
    </Card>
  );
};