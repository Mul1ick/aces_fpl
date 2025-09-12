import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from 'lucide-react';

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

const mockLeagueStandings = [
    { rank: 1, teamName: 'FC Salah', manager: 'Mo Salah', points: 1250 },
    { rank: 2, teamName: 'Eric Ten Hoes', manager: 'Arjun Dangle', points: 1245 },
    { rank: 3, teamName: 'KDBs Crew', manager: 'Kevin De Bruyne', points: 1230 },
];

export const ManagerInfoCard: React.FC = () => {
  return (
     <Card className="border-gray-300 border-2 h-full">
        <CardContent className="p-4">
            <div className="text-left mb-4">
                <h2 className="text-3xl font-extrabold">Eric Ten Hoes</h2>
                <p className="text-sm text-gray-500">Arjun Dangle</p>
            </div>
             <div className="border-b border-gray-200 my-4"></div>

            {/* Points & Rankings Section */}
            <div>
                <h3 className="font-bold text-lg mb-2">Points & Rankings</h3>
                <div className="space-y-1">
                     <StatRow label="Overall points" value="70" />
                    <StatRow label="Overall rank" value="958,151" />
                    <StatRow label="Total players" value="10,568,811" />
                    <StatRow label="Gameweek points" value="70" />
                    <LinkRow label="Gameweek History" />
                </div>
            </div>
            <div className="border-b border-gray-200 my-4"></div>

            {/* League Table */}
             <div>
                <h3 className="font-bold text-lg mb-2">League Standing</h3>
                <div className="space-y-2">
                    {mockLeagueStandings.map(team => (
                         <div key={team.rank} className="flex items-center justify-between text-sm p-1">
                            <div className="flex items-center">
                                <span className="font-bold text-gray-500 w-6">{team.rank}</span>
                                 <p className="font-semibold">{team.teamName}</p>
                            </div>
                            <p className="font-bold">{team.points}</p>
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
                    <LinkRow label="Transfer History" />
                </div>
            </div>
             <div className="border-b border-gray-200 my-4"></div>

            {/* Finance Section */}
            <div>
                <h3 className="font-bold text-lg mb-2">Finance</h3>
                <div className="space-y-1">
                     <StatRow label="Squad value" value="£100.1m" />
                    <StatRow label="In the bank" value="£0.0m" />
                </div>
            </div>
            <div className="border-b border-gray-200 my-4"></div>

             {/* Admin Section */}
            <div>
                <h3 className="font-bold text-lg mb-2">Admin</h3>
                <div className="space-y-1">
                    <LinkRow label="Team Details" />
                     <LinkRow label="User Profile" />
                </div>
            </div>
        </CardContent>
    </Card>
  );
};