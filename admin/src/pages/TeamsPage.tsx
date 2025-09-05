import React, { useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { TeamToolbar } from '@/components/teams/TeamsToolbar';
import { TeamsTable } from '@/components/teams/TeamsTable';
import { TeamFormModal } from '@/components/teams/TeamFormModal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { TeamActions } from '@/components/teams/TeamActions';
import type { Team, Player } from '@/types';

// --- DUMMY DATA ---
const DUMMY_TEAMS: Team[] = [
  { id: 1, name: 'Satan', short_name: 'SAT', logo_url: 'red.png', next_fixture: 'MUN (A)' },
  { id: 2, name: 'Bandra United', short_name: 'BAN', logo_url: 'blue.png', next_fixture: 'SAT (H)' },
  { id: 3, name: 'Mumbai Hotspurs', short_name: 'MHS', logo_url: 'white.png', next_fixture: 'UMA (A)' },
  { id: 4, name: 'Southside', short_name: 'SOU', logo_url: 'black.png', next_fixture: 'TIT (H)' },
  { id: 5, name: 'Titans', short_name: 'TIT', logo_url: 'yellow.png', next_fixture: 'SOU (A)' },
  { id: 6, name: 'Umaag Foundation Trust', short_name: 'UMA', logo_url: 'grey.png', next_fixture: 'MHS (H)' },
];

const DUMMY_PLAYERS: Pick<Player, 'id' | 'team_id'>[] = [
    { id: 1, team_id: 1 }, { id: 2, team_id: 1 }, { id: 3, team_id: 1 },
    { id: 4, team_id: 2 }, { id: 5, team_id: 2 },
    { id: 6, team_id: 3 }, { id: 7, team_id: 3 }, { id: 8, team_id: 3 },
    { id: 9, team_id: 4 }, { id: 10, team_id: 4 }, { id: 11, team_id: 4 },
    { id: 12, team_id: 5 }, { id: 13, team_id: 5 },
    { id: 14, team_id: 6 },
];
// --- END DUMMY DATA ---

export function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>(DUMMY_TEAMS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);

  const { toast } = useToast();

  const playerCounts = useMemo(() => {
    const counts: { [key: number]: number } = {};
    for (const team of teams) {
        counts[team.id] = DUMMY_PLAYERS.filter(p => p.team_id === team.id).length;
    }
    return counts;
  }, [teams]);

  const handleAddTeam = () => {
    setEditingTeam(null);
    setIsModalOpen(true);
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setIsModalOpen(true);
  };

  const handleDeleteTeam = (team: Team) => {
    setDeletingTeam(team);
  };

  const handleConfirmDelete = useCallback(() => {
    if (!deletingTeam) return;
    setTeams(prevTeams => prevTeams.filter(team => team.id !== deletingTeam.id));
    toast({ title: "Success", description: `${deletingTeam.name} has been deleted.` });
    setDeletingTeam(null);
  }, [deletingTeam, toast]);

  const handleSubmitForm = (teamData: Omit<Team, 'id'>, teamId?: number) => {
    if (teamId) {
      setTeams(prevTeams =>
        prevTeams.map(team =>
          team.id === teamId ? { ...team, ...teamData, logo_url: team.logo_url } : team
        )
      );
      toast({ title: "Success", description: "Team updated successfully." });
    } else {
      const newTeam: Team = {
        id: Math.max(...teams.map(t => t.id), 0) + 1,
        ...teamData,
        logo_url: 'grey.png', // Default logo for new teams
      };
      setTeams(prevTeams => [...prevTeams, newTeam]);
      toast({ title: "Success", description: "Team created successfully." });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Team Management</h1>
        <p className="text-muted-foreground">
          Create, edit, and manage all real-world teams in the league.
        </p>
      </div>

      <div className="bg-card border rounded-lg admin-card-shadow">
        <TeamToolbar onAddTeam={handleAddTeam} />
        <TeamsTable 
            teams={teams}
            playerCounts={playerCounts}
            onEditTeam={handleEditTeam}
            onDeleteTeam={handleDeleteTeam}
        />
      </div>

      <TeamFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitForm}
        editingTeam={editingTeam}
      />
      
      <ConfirmDialog
        open={!!deletingTeam}
        onOpenChange={(isOpen) => !isOpen && setDeletingTeam(null)}
        title="Are you sure?"
        description={`This will permanently delete ${deletingTeam?.name}. This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        variant="destructive"
        confirmText="Delete"
      />
    </div>
  );
}

