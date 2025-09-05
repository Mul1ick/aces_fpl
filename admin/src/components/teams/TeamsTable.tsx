import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TeamActions } from './TeamActions';
import type { Team } from '@/types';

interface TeamsTableProps {
  teams: Team[];
  playerCounts?: { [key: number]: number }; // Made prop optional
  onEditTeam: (team: Team) => void;
  onDeleteTeam: (team: Team) => void;
}

// Added a default empty object {} for playerCounts to prevent crashes
export function TeamsTable({ teams, playerCounts = {}, onEditTeam, onDeleteTeam }: TeamsTableProps) {
  // Function to safely construct the logo path
  const getLogoPath = (logoUrl: string | undefined) => {
    if (!logoUrl) {
      // Return a path to a default/placeholder logo if none is provided
      return `/src/assets/images/team-logos/grey.png`;
    }
    return `/src/assets/images/team-logos/${logoUrl}`;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[80px]">Logo</TableHead>
          <TableHead>Team Name</TableHead>
          <TableHead className="text-center">Short Name</TableHead>
          <TableHead className="text-center">Player Count</TableHead>
          <TableHead>Next Fixture</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {teams.map((team) => (
          <TableRow key={team.id}>
            <TableCell>
              <img
                src={getLogoPath(team.logo_url)}
                alt={`${team.name} logo`}
                className="h-8 w-8 object-contain"
                // Add an onerror handler to show a fallback if the image fails to load
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null; // prevent infinite loop
                  target.src = getLogoPath(undefined);
                }}
              />
            </TableCell>
            <TableCell className="font-medium">{team.name}</TableCell>
            <TableCell className="text-center font-mono text-muted-foreground">{team.short_name}</TableCell>
            <TableCell className="text-center">{playerCounts[team.id] || 0}</TableCell>
            <TableCell>{team.next_fixture || 'N/A'}</TableCell>
            <TableCell className="text-right">
              <TeamActions
                team={team}
                onEdit={onEditTeam}
                onDelete={onDeleteTeam}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

