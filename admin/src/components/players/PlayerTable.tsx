import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlayerActions } from './PlayerActions';
import type { Player, PlayerStatus } from '@/types';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type SortConfig = {
  key: keyof Player;
  direction: 'ascending' | 'descending';
} | null;

interface PlayerTableProps {
  players: Player[];
  onEdit: (player: Player) => void;
  onDelete: (player: Player) => void;
  onUpdateStatus: (player: Player) => void; 
  sortConfig: SortConfig;
  onSortRequest: (key: keyof Player) => void;
}

// --- MODIFICATION: Destructured onUpdateStatus from props ---
export function PlayerTable({ players, onEdit, onDelete, onUpdateStatus, sortConfig, onSortRequest }: PlayerTableProps) {
  const STATUS_LABEL: Record<PlayerStatus, string> = {
    ACTIVE: 'Available',
    INJURED: 'Injured',
    SUSPENDED: 'Suspended',
    // --- ADDED: Handle the new status ---
    UNAVAILABLE: 'Unavailable'
  };
  const STATUS_CLASS: Record<PlayerStatus, string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    INJURED: 'bg-yellow-100 text-yellow-700',
    SUSPENDED: 'bg-red-100 text-red-700',
    // --- ADDED: Style for the new status ---
    UNAVAILABLE: 'bg-gray-100 text-gray-700'
  };

  function getStatusClass(s?: PlayerStatus) {
    // Fallback for null or undefined status
    if (!s) return 'bg-muted text-muted-foreground border-0';
    return STATUS_CLASS[s] || 'bg-muted text-muted-foreground border-0';
  }
  
  const renderSortArrow = (key: keyof Player) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? <ArrowUp className="h-4 w-4 ml-2" /> : <ArrowDown className="h-4 w-4 ml-2" />;
  };

  const SortableHeader = ({ sortKey, children }: { sortKey: keyof Player, children: React.ReactNode }) => (
    <TableHead>
      <Button variant="ghost" onClick={() => onSortRequest(sortKey)} className="px-2 py-1 h-auto">
        {children}
        {renderSortArrow(sortKey)}
      </Button>
    </TableHead>
  );

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader sortKey="full_name">Player</SortableHeader>
            <SortableHeader sortKey="team">Team</SortableHeader>
            <SortableHeader sortKey="position">Position</SortableHeader>
            <SortableHeader sortKey="price">Price</SortableHeader>
            <SortableHeader sortKey="status">Status</SortableHeader>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player) => (
            <TableRow key={player.id}>
              <TableCell className="font-medium">{player.full_name}</TableCell>
              <TableCell>{player.team.short_name}</TableCell>
              <TableCell>{player.position}</TableCell>
              <TableCell>£{player.price.toFixed(1)}m</TableCell>
              <TableCell>
                {player.status ? (
                  <Badge variant="outline" className={cn(getStatusClass(player.status))}>
                    {STATUS_LABEL[player.status]}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                {/* --- MODIFICATION: Passed the onUpdateStatus prop --- */}
                <PlayerActions 
                  player={player} 
                  onEdit={onEdit} 
                  onDelete={onDelete} 
                  onUpdateStatus={onUpdateStatus} 
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}