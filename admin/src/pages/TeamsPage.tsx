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

  // ✅ Extract loadTeams
  const loadTeams = useCallback(async () => {
    const t = token || localStorage.getItem("admin_token");
    if (!t) {
      console.warn("[TeamsPage] No admin token found — not fetching");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log("[TeamsPage] Fetching teams…");
      const data = await teamAPI.getTeams(t); // GET /admin/teams
      console.log("[TeamsPage] Teams loaded:", data?.length);
      setTeams(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error("[TeamsPage] Load error:", e);
      setError(e.message || "Failed to load teams");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // fetch on mount
  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

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
    if (!deletingTeam) return;
    const adminToken = token || localStorage.getItem("admin_token");
    if (!adminToken) return;

    try {
      await teamAPI.deleteTeam(String(deletingTeam.id), adminToken);
      setTeams(prev => prev.filter(t => t.id !== deletingTeam.id));
      toast({ title: "Success", description: `${deletingTeam.name} has been deleted.` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Delete failed", description: e.message || "Error" });
    } finally {
      setDeletingTeam(null);
    }
  }, [deletingTeam, token, toast]);

  // ✅ Fixed: call loadTeams after create/update
  const handleSubmitForm = async (data: { name: string; short_name: string }, teamId?: number) => {
    const adminToken = token || localStorage.getItem("admin_token");
    if (!adminToken) {
      toast({ variant: "destructive", title: "Not authenticated" });
      return;
    }

    try {
      setIsLoading(true);
      if (teamId) {
        await teamAPI.updateTeam(teamId, data, adminToken);
        toast({ title: "Team updated" });
      } else {
        await teamAPI.createTeam(data, adminToken);
        toast({ title: "Team created" });
      }
      await loadTeams(); // refresh list
      setIsModalOpen(false);
      setEditingTeam(null);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Save failed", description: e.message || "Error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Team Management</h1>
        <p className="text-muted-foreground">Create, edit, and manage all real-world teams in the league.</p>
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