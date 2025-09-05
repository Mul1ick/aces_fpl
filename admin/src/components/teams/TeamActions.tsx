import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import type { Team } from '@/types';

interface TeamActionsProps {
  team: Team;
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
}

export function TeamActions({ team, onEdit, onDelete }: TeamActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(team)}>
          <Edit className="mr-2 h-4 w-4" />
          <span>Edit Team</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDelete(team)} className="text-destructive focus:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete Team</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
