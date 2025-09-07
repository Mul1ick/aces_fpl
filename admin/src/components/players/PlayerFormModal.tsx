import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Player, Team, PlayerFormData, PlayerStatus } from '@/types';

interface PlayerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (playerData: PlayerFormData, playerId?: number) => void;
  teams: Team[];
  editingPlayer: Player | null;
}

const initialFormData: PlayerFormData = {
  full_name: '',
  position: 'MID',
  price: 5.0,
  team_id: 0,
  status: 'ACTIVE',
};

export function PlayerFormModal({
  isOpen,
  onClose,
  onSubmit,
  teams,
  editingPlayer,
}: PlayerFormModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<PlayerFormData>(initialFormData);

  const isEditMode = !!editingPlayer;

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && editingPlayer) {
        // Pre-fill form for editing an existing player
        setFormData({
          full_name: editingPlayer.full_name,
          position: editingPlayer.position,
          price: editingPlayer.price,
          team_id: editingPlayer.team.id,
          status: editingPlayer.status,
        });
      } else {
        // Reset form for creating a new player, ensuring a valid default team_id
        setFormData({
            ...initialFormData,
            team_id: teams[0]?.id || 0,
        });
      }
    }
  }, [editingPlayer, isEditMode, isOpen, teams]);

  const handleChange = (field: keyof PlayerFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.team_id) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Player name and team are required.',
      });
      return;
    }
    onSubmit(formData, editingPlayer?.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Player' : 'Add New Player'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update the player's details below." : "Enter the details for the new player."}
          </DialogDescription>
        </DialogHeader>
        <form id="player-form" onSubmit={handleFormSubmit} className="space-y-4 py-4">
            <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input id="full_name" value={formData.full_name} onChange={(e) => handleChange('full_name', e.target.value)} placeholder="e.g., John Doe" />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="position">Position</Label>
                    <Select value={formData.position} onValueChange={(value: 'GK' | 'DEF' | 'MID' | 'FWD') => handleChange('position', value)}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="GK">Goalkeeper</SelectItem>
                            <SelectItem value="DEF">Defender</SelectItem>
                            <SelectItem value="MID">Midfielder</SelectItem>
                            <SelectItem value="FWD">Forward</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div>
                    <Label htmlFor="price">Price (£m)</Label>
                    <Input 
                      id="price" 
                      type="number" 
                      step="0.1" 
                      value={formData.price} 
                      onChange={(e) => handleChange('price', parseFloat(e.target.value))} 
                      disabled={isEditMode} // Price is not editable in edit mode
                      aria-describedby="price-description"
                    />
                    {isEditMode && <p id="price-description" className="text-xs text-muted-foreground mt-1">Price cannot be changed after creation.</p>}
                </div>
            </div>
             <div>
                <Label htmlFor="team">Team</Label>
                <Select value={String(formData.team_id)} onValueChange={(value) => handleChange('team_id', parseInt(value, 10))}>
                    <SelectTrigger><SelectValue placeholder="Select a team"/></SelectTrigger>
                    <SelectContent>
                        {teams.map(team => <SelectItem key={team.id} value={String(team.id)}>{team.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
             <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: PlayerStatus) => handleChange('status', value)}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INJURED">Injured</SelectItem>
                        <SelectItem value="SUSPENDED">Suspended</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="player-form">{isEditMode ? 'Save Changes' : 'Create Player'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
