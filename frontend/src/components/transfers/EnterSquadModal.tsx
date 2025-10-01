import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

interface EnterSquadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (teamName: string) => void;
}

export const EnterSquadModal: React.FC<EnterSquadModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [teamName, setTeamName] = useState('');

  const handleConfirm = () => {
    if (teamName.trim()) {
      onConfirm(teamName);
    } else {
      // This is a fallback, the button will be disabled if the name is empty.
      alert('Please enter a team name.');
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
                {/* --- ADDED: Disclaimer text --- */}
                <p className="text-xs text-gray-500 mt-2">Team names cannot be changed inbetween season.</p>
              </div>

              {/* --- REMOVED: Checkbox and terms section --- */}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              {/* --- MODIFIED: Updated disabled logic --- */}
              <Button onClick={handleConfirm} disabled={!teamName.trim()}>Enter Squad</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};