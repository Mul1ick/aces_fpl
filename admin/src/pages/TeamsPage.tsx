import React, { useState, useCallback, useMemo,useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { TeamToolbar } from '@/components/teams/TeamsToolbar';
import { TeamsTable } from '@/components/teams/TeamsTable';
import { TeamFormModal } from '@/components/teams/TeamFormModal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { TeamActions } from '@/components/teams/TeamActions';
import type { Team, Player } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { teamAPI } from '@/lib/api';





export function TeamsPage() {
  const { token } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);

  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  
  useEffect(() => {
  const t = token || localStorage.getItem("admin_token");
  if (!t) {
    console.warn("[TeamsPage] No admin token found — not fetching");
    setIsLoading(false);
    return;
  }

  (async () => {
    try {
      setError(null);
      console.log("[TeamsPage] Fetching teams…");
      const data = await teamAPI.getTeams(t); // must call /admin/teams
      console.log("[TeamsPage] Teams loaded:", data?.length);
      setTeams(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error("[TeamsPage] Load error:", e);
      setError(e.message || "Failed to load teams");
    } finally {
      setIsLoading(false);
    }
  })();
}, [token]);
console.log("[TeamsPage] teams rx:", teams.map(t => ({ id: t.id, name: t.name, pc: (t as any).player_count })));

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

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingTeam || !token) return;
    try {
      await teamAPI.deleteTeam(String(deletingTeam.id), token); // DELETE /admin/teams/{id}
      setTeams(prev => prev.filter(t => t.id !== deletingTeam.id));
      toast({ title: 'Success', description: `${deletingTeam.name} has been deleted.` });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Delete failed', description: e.message || 'Error' });
    } finally {
      setDeletingTeam(null);
    }
  }, [deletingTeam, token, toast]);

  const handleSubmitForm = async (teamData: Omit<Team, 'id'>, teamId?: number) => {
    if (!token) return;
    try {
      if (teamId) {
        const updated = await teamAPI.updateTeam(String(teamId), teamData, token); // PUT /admin/teams/{id}
        setTeams(prev => prev.map(t => (t.id === teamId ? updated : t)));
        toast({ title: 'Success', description: 'Team updated successfully.' });
      } else {
        const created = await teamAPI.createTeam(teamData, token); // POST /admin/teams
        setTeams(prev => [created, ...prev]);
        toast({ title: 'Success', description: 'Team created successfully.' });
      }
      setIsModalOpen(false);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Save failed', description: e.message || 'Error' });
    }
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

