import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import chipsIcon from '@/assets/images/chips.png';
// --- ADDED: Import the utility to get a team's jersey ---
import { getTeamJersey } from '@/lib/player-utils';

// --- MODIFIED: This component now handles player objects ---
const StatusItem = ({ label, value, player, imageUrl }: { 
  label: string; 
  value: string | number; 
  player?: { name: string; team_name: string; };
  imageUrl?: string;
}) => {
  // Determine the jersey or icon to display
  const imageToDisplay = imageUrl || (player ? getTeamJersey(player.team_name) : undefined);

  return (
    <div className="text-center flex flex-col items-center space-y-2">
      <Avatar className="w-12 h-12">
        {imageToDisplay ? (
          <AvatarImage src={imageToDisplay} alt={label} className="object-contain p-1" />
        ) : (
          <AvatarFallback className="bg-gray-200 text-black font-bold">
            ?
          </AvatarFallback>
        )}
      </Avatar>
      <div>
        {/* --- MODIFIED: Display player name from object, or the default value --- */}
        <p className="font-bold text-lg text-black truncate max-w-[100px]">{player?.name || value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
};

interface GameweekStatusCardProps {
  stats: {
    chips_played?: number;
    // --- MODIFIED: These props now expect the new object structure ---
    most_captained?: { name: string; team_name: string; };
    most_vice_captained?: { name: string; team_name: string; };
    most_selected?: { name: string; team_name: string; };
  } | null;
}

export const GameweekStatusCard: React.FC<GameweekStatusCardProps> = ({ stats }) => {
  return (
    <Card className="h-full border-black border-2">
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
        {/* --- MODIFIED: Updated props to pass the correct data --- */}
        <StatusItem label="Chips Played" value={stats?.chips_played ?? 0} imageUrl={chipsIcon} />
        <StatusItem label="Most Captained" value={stats?.most_captained?.name ?? '...'} player={stats?.most_captained} />
        <StatusItem label="Most Vice-Captained" value={stats?.most_vice_captained?.name ?? '...'} player={stats?.most_vice_captained} />
        <StatusItem label="Most Selected" value={stats?.most_selected?.name ?? '...'} player={stats?.most_selected} />
      </CardContent>
    </Card>
  );
};