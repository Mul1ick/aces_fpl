import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';

const clubs = [
  'Satan', 'Mumbai Hotspurs', 'Bandra United', 'Southside', 'Titans', 'Umaag Foundation Trust', 'None'
];

interface EnterSquadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (teamName: string, favouriteClub: string) => void;
}

export const EnterSquadModal: React.FC<EnterSquadModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [teamName, setTeamName] = useState('');
  const [favouriteClub, setFavouriteClub] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleConfirm = () => {
    if (teamName.trim() && favouriteClub && termsAccepted) {
      onConfirm(teamName, favouriteClub);
    } else {
      alert('Please fill in all fields and accept the terms.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex"
        >
          {/* Translucent Left Side (Desktop Only) */}
          <div className="hidden lg:block lg:w-1/2 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>

          {/* Solid Right Side / Full Mobile View */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full lg:w-1/2 bg-white text-black p-6 flex flex-col"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Enter Squad</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="space-y-6 flex-1">
              <div>
                <Label htmlFor="team-name" className="font-bold">Pick your team name</Label>
                <p className="text-xs text-gray-500 mb-2">Maximum 20 characters</p>
                <Input 
                  id="team-name" 
                  maxLength={20} 
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="favourite-club" className="font-bold">Choose your favourite club</Label>
                <Select onValueChange={setFavouriteClub}>
                  <SelectTrigger id="favourite-club" className="w-full mt-2">
                    <SelectValue placeholder="Pick Team" />
                  </SelectTrigger>
                  <SelectContent>
                    {clubs.map(club => (
                      <SelectItem key={club} value={club}>{club}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox id="terms" checked={termsAccepted} onCheckedChange={setTermsAccepted} />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I accept the Terms & Conditions
                  </label>
                  <p className="text-xs text-gray-500">
                    By creating a Fantasy team you will automatically receive updates relating to Fantasy if you are already opted into our general Premier League emails. 
                    (<a href="#" className="underline">Read full terms</a>)
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleConfirm} disabled={!termsAccepted || !teamName.trim() || !favouriteClub}>Enter Squad</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
