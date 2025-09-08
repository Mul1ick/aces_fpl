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


export const ManagerHubCard: React.FC = () => {
  return (
    <Card className="h-full border-black border-2">
        <CardContent className="p-4">
            {/* Points & Rankings Section */}
            <div>
                <h3 className="font-bold text-lg mb-2">Points & Rankings</h3>
                <div className="space-y-1">
                    <StatRow label="Overall points" value="70" />
                    <StatRow label="Overall rank" value="958,151" />
                    <StatRow label="Total players" value="10,499,008" />
                    <StatRow label="Gameweek points" value="70" />
                    <LinkRow label="Gameweek History" />
                </div>
            </div>

            {/* Transfers Section */}
            <div className="mt-6">
                <h3 className="font-bold text-lg mb-2">Transfers</h3>
                <div className="space-y-1">
                    <StatRow label="Gameweek transfers" value="0" />
                    <StatRow label="Total transfers" value="0" />
                    <LinkRow label="Transfer History" />
                </div>
            </div>

            {/* Finance Section */}
            <div className="mt-6">
                <h3 className="font-bold text-lg mb-2">Finance</h3>
                <div className="space-y-1">
                    <StatRow label="Squad value" value="£100.1m" />
                    <StatRow label="In the bank" value="£0.0m" />
                </div>
            </div>

            {/* Admin Section */}
            <div className="mt-6">
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
