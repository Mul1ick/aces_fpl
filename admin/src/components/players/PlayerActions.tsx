import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
// --- ADDED AlertTriangle icon ---
import { MoreHorizontal, Edit, Trash2, AlertTriangle } from 'lucide-react';
import type { Player } from '@/types';

interface PlayerActionsProps {
  player: Player;
  onEdit: (player: Player) => void;
  onDelete: (player: Player) => void;
  // --- ADDED: Prop for the new action ---
  onUpdateStatus: (player: Player) => void;
}

export function PlayerActions({ player, onEdit, onDelete, onUpdateStatus }: PlayerActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu for {player.full_name}</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onEdit(player)} className="cursor-pointer">
          <Edit className="mr-2 h-4 w-4" />
          <span>Edit Details</span>
        </DropdownMenuItem>
        
        {/* --- ADDED: New Menu Item for Status --- */}
        <DropdownMenuItem onClick={() => onUpdateStatus(player)} className="cursor-pointer">
          <AlertTriangle className="mr-2 h-4 w-4" />
          <span>Update Availability</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onDelete(player)} className="cursor-pointer text-destructive focus:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete Player</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}