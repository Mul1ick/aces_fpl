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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Activity, AlertCircle, Ban, Plane, CalendarX, Info } from 'lucide-react';
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
      setStatus(player.status || 'ACTIVE');
      setNews(player.news || '');
      setChance(player.chance_of_playing !== null && player.chance_of_playing !== undefined ? String(player.chance_of_playing) : '100');
      
      if (player.return_date) {
        try {
          setReturnDate(new Date(player.return_date).toISOString().split('T')[0]);
          setIsReturnUnknown(false);
        } catch (e) {
          setReturnDate('');
          setIsReturnUnknown(true);
        }
      } else {
        setReturnDate('');
        setIsReturnUnknown(player.status !== 'ACTIVE');
      }
    }
  }, [isOpen, player]);

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

  // Helper for FPL-style color coding
  const getChanceColor = (val: string) => {
    switch (val) {
      case '0': return 'bg-red-500 hover:bg-red-600 text-white border-red-600';
      case '25': return 'bg-orange-600 hover:bg-orange-700 text-white border-orange-700';
      case '50': return 'bg-orange-400 hover:bg-orange-500 text-white border-orange-500';
      case '75': return 'bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-500';
      case '100': return 'bg-green-500 hover:bg-green-600 text-white border-green-600';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            Update Player Status
          </DialogTitle>
          <DialogDescription>
            Modify availability and injury news for <span className="font-bold text-foreground">{player?.full_name}</span>.
          </DialogDescription>
        </DialogHeader>
        
        <form id="status-form" onSubmit={handleSubmit} className="space-y-6 py-2">
          
          {/* Status Selection Cards */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Current Status</Label>
            <RadioGroup 
              value={status} 
              onValueChange={handleStatusChange} 
              className="grid grid-cols-2 gap-3"
            >
              <Label className="cursor-pointer">
                <RadioGroupItem value="ACTIVE" className="sr-only" />
                <div className={`flex items-center gap-3 rounded-lg border-2 p-3 transition-all ${status === 'ACTIVE' ? 'border-green-500 bg-green-500/10' : 'border-muted hover:bg-accent'}`}>
                  <Activity className={`h-5 w-5 ${status === 'ACTIVE' ? 'text-green-600' : 'text-muted-foreground'}`} />
                  <span className="font-medium">Active</span>
                </div>
              </Label>

              <Label className="cursor-pointer">
                <RadioGroupItem value="INJURED" className="sr-only" />
                <div className={`flex items-center gap-3 rounded-lg border-2 p-3 transition-all ${status === 'INJURED' ? 'border-orange-500 bg-orange-500/10' : 'border-muted hover:bg-accent'}`}>
                  <AlertCircle className={`h-5 w-5 ${status === 'INJURED' ? 'text-orange-600' : 'text-muted-foreground'}`} />
                  <span className="font-medium">Injured</span>
                </div>
              </Label>

              <Label className="cursor-pointer">
                <RadioGroupItem value="SUSPENDED" className="sr-only" />
                <div className={`flex items-center gap-3 rounded-lg border-2 p-3 transition-all ${status === 'SUSPENDED' ? 'border-red-500 bg-red-500/10' : 'border-muted hover:bg-accent'}`}>
                  <Ban className={`h-5 w-5 ${status === 'SUSPENDED' ? 'text-red-600' : 'text-muted-foreground'}`} />
                  <span className="font-medium">Suspended</span>
                </div>
              </Label>

              <Label className="cursor-pointer">
                <RadioGroupItem value="UNAVAILABLE" className="sr-only" />
                <div className={`flex items-center gap-3 rounded-lg border-2 p-3 transition-all ${status === 'UNAVAILABLE' ? 'border-blue-500 bg-blue-500/10' : 'border-muted hover:bg-accent'}`}>
                  <Plane className={`h-5 w-5 ${status === 'UNAVAILABLE' ? 'text-blue-600' : 'text-muted-foreground'}`} />
                  <span className="font-medium">Unavailable</span>
                </div>
              </Label>
            </RadioGroup>
          </div>

          {/* Conditional Fields based on status */}
          {status !== 'ACTIVE' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-muted-foreground"/>
                  Status Reason / News
                </Label>
                <Textarea 
                  placeholder="e.g., Hamstring strain - awaiting scan results..." 
                  value={news} 
                  onChange={(e) => setNews(e.target.value)}
                  className="resize-none"
                  rows={2}
                />
              </div>

              <div className="space-y-3">
                <Label>Chance of Playing</Label>
                <div className="flex gap-2">
                  {['0', '25', '50', '75'].map((pct) => (
                    <Button
                      key={pct}
                      type="button"
                      variant={chance === pct ? "default" : "outline"}
                      className={`flex-1 transition-colors ${chance === pct ? getChanceColor(pct) : ''}`}
                      onClick={() => setChance(pct)}
                    >
                      {pct}%
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 rounded-lg border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <CalendarX className="h-4 w-4 text-muted-foreground"/>
                    Expected Return Date
                  </Label>
                  <div className="flex items-center gap-2">
                    <Switch 
                      id="unknown-date" 
                      checked={isReturnUnknown} 
                      onCheckedChange={(checked) => {
                        setIsReturnUnknown(checked);
                        if (checked) setReturnDate('');
                      }}
                    />
                    <Label htmlFor="unknown-date" className="text-xs font-normal cursor-pointer">Unknown</Label>
                  </div>
                </div>
                
                <div className={`transition-opacity ${isReturnUnknown ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
                  <Input 
                    type="date" 
                    value={returnDate} 
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

            </div>
          )}
        </form>

        <DialogFooter className="pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="status-form" className="w-full sm:w-auto">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}