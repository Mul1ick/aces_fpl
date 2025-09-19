import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const getInitials = (name?: string) => {
  if (!name || name === "N/A") return "?";
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};


const StatusItem = ({ label, value }: { label: string; value: string | number }) => (
  <div className="text-center flex flex-col items-center space-y-2">
    <Avatar className="w-12 h-12">
      <AvatarFallback className="bg-gray-200 text-black font-bold">
        {typeof value === 'string' ? getInitials(value) : value}
      </AvatarFallback>
    </Avatar>
    <div>
      <p className="font-bold text-lg text-black truncate max-w-[100px]">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  </div>
);

interface GameweekStatusCardProps {
  stats: {
    chips_played?: number;
    most_captained?: string;
    most_vice_captained?: string;
    most_selected?: string;
  } | null;
}


export const GameweekStatusCard: React.FC<GameweekStatusCardProps> = ({ stats }) => {
  return (
    <Card className="h-full border-black border-2">
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
        <StatusItem label="Chips Played" value={stats?.chips_played ?? '...'} />
        <StatusItem label="Most Captained" value={stats?.most_captained ?? '...'} />
        <StatusItem label="Most Vice-Captained" value={stats?.most_vice_captained ?? '...'} />
        <StatusItem label="Most Selected" value={stats?.most_selected ?? '...'} />
      </CardContent>
    </Card>
  );
};
