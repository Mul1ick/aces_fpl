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
import { Checkbox } from '@/components/ui/checkbox';
import type { Player, PlayerStatus } from '@/types';

interface PlayerStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (playerId: number, data: any) => void;
  player: Player | null;
}

export function PlayerStatusModal({
  isOpen,
  onClose,
  onSubmit,
  player,
}: PlayerStatusModalProps) {
  const [status, setStatus] = useState<PlayerStatus>('ACTIVE');
  const [news, setNews] = useState('');
  const [chance, setChance] = useState<string>('100');
  const [returnDate, setReturnDate] = useState('');
  const [isReturnUnknown, setIsReturnUnknown] = useState(false);

  useEffect(() => {
    if (isOpen && player) {
      setStatus(player.status);
      setNews(player.news || '');
      setChance(player.chance_of_playing !== null && player.chance_of_playing !== undefined ? String(player.chance_of_playing) : '100');
      
      if (player.return_date) {
        // Format ISO date to YYYY-MM-DD for the input
        setReturnDate(new Date(player.return_date).toISOString().split('T')[0]);
        setIsReturnUnknown(false);
      } else {
        setReturnDate('');
        // If status is not active but no date, assume unknown
        setIsReturnUnknown(player.status !== 'ACTIVE');
      }
    }
  }, [isOpen, player]);

  // Smart defaults when status changes
  const handleStatusChange = (val: PlayerStatus) => {
    setStatus(val);
    if (val === 'ACTIVE') {
      setNews('');
      setChance('100');
      setReturnDate('');
      setIsReturnUnknown(false);
    } else if (val === 'SUSPENDED') {
      setChance('0');
    } else if (val === 'INJURED') {
      // Default to 0, but allow change
      if (chance === '100') setChance('0');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!player) return;

    const payload = {
      status,
      news: status === 'ACTIVE' ? null : news,
      chance_of_playing: status === 'ACTIVE' ? null : parseInt(chance),
      return_date: (status === 'ACTIVE' || isReturnUnknown || !returnDate) ? null : new Date(returnDate).toISOString(),
    };

    onSubmit(player.id, payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Availability</DialogTitle>
          <DialogDescription>
            Set the availability status for <span className="font-semibold text-foreground">{player?.full_name}</span>.
          </DialogDescription>
        </DialogHeader>
        
        <form id="status-form" onSubmit={handleSubmit} className="space-y-4 py-4">
          
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v: PlayerStatus) => handleStatusChange(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active (Available)</SelectItem>
                <SelectItem value="INJURED">Injured</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="UNAVAILABLE">Unavailable (Personal/Other)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {status !== 'ACTIVE' && (
            <>
              <div className="space-y-2">
                <Label>Reason / News</Label>
                <Input 
                  placeholder="e.g. Hamstring Injury, Red Card" 
                  value={news} 
                  onChange={(e) => setNews(e.target.value)} 
                />
              </div>

              <div className="space-y-2">
                <Label>Chance of Playing</Label>
                <Select value={chance} onValueChange={setChance}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0% (Red Flag)</SelectItem>
                    <SelectItem value="25">25% (Dark Orange)</SelectItem>
                    <SelectItem value="50">50% (Orange)</SelectItem>
                    <SelectItem value="75">75% (Yellow Flag)</SelectItem>
                    <SelectItem value="100">100% (Available)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Expected Return Date</Label>
                <div className="flex items-center gap-3">
                  <Input 
                    type="date" 
                    value={returnDate} 
                    onChange={(e) => {
                      setReturnDate(e.target.value);
                      setIsReturnUnknown(false);
                    }}
                    disabled={isReturnUnknown}
                    className={isReturnUnknown ? "opacity-50" : ""}
                  />
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <Checkbox 
                      id="unknown-date" 
                      checked={isReturnUnknown} 
                      onCheckedChange={(checked) => {
                        setIsReturnUnknown(checked as boolean);
                        if (checked) setReturnDate('');
                      }}
                    />
                    <Label htmlFor="unknown-date" className="text-sm cursor-pointer">Unknown</Label>
                  </div>
                </div>
              </div>
            </>
          )}

        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="status-form">Update Status</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}