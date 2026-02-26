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
import { useToast } from '@/hooks/use-toast';
import type { Team } from '@/types';

interface TeamFormModalProps {
   isOpen: boolean;
   onClose: () => void;
   onSubmit: (teamData: { name: string; short_name: string }, teamId?: number) => void;
   editingTeam: Team | null;
 }

export function TeamFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingTeam,
}: TeamFormModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    short_name: '',
  });

  const isEditMode = !!editingTeam;

  useEffect(() => {
    if (isEditMode && editingTeam) {
      setFormData({
        name: editingTeam.name,
        short_name: editingTeam.short_name,
      });
    } else {
      setFormData({
        name: '',
        short_name: '',
      });
    }
  }, [editingTeam, isEditMode, isOpen]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.short_name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Team Name and Short Name are required.',
      });
      return;
    }
    
    // LIMIT INCREASED TO 10
    if (formData.short_name.trim().length > 10) {
        toast({
            variant: 'destructive',
            title: 'Validation Error',
            description: 'Short Name must be 10 characters or less.',
        });
        return;
    }
    
    onSubmit(
      { name: formData.name.trim(), short_name: formData.short_name.trim().toUpperCase() },
      editingTeam?.id
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Team' : 'Add New Team'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update the team's details below." : "Enter the details for the new team."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4" id="team-form">
            <div>
                <Label htmlFor="name">Team Name</Label>
                <Input id="name" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} />
            </div>
            <div>
                <Label htmlFor="short_name">Short Name</Label>
                <Input id="short_name" value={formData.short_name} onChange={(e) => handleChange('short_name', e.target.value.toUpperCase())} maxLength={10} />
            </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="team-form">{isEditMode ? 'Save Changes' : 'Create Team'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}