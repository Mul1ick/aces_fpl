import React from 'react';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format, isValid } from 'date-fns';

// Interface for the gameweek data we expect
interface Gameweek {
  gw_number: number;
  deadline: string;
}

interface TransfersHeroCardProps {
  playersSelected: number;
  bank: number;
  notification: { message: string; type: 'success' | 'error' } | null;
  user: {
    free_transfers: number;
    played_first_gameweek: boolean;
    has_team?: boolean;
  } | null;
  view: 'pitch' | 'list';
  setView: (view: 'pitch' | 'list') => void;
  gameweek: Gameweek | null;
  transferCount: number;
  transferCost: number;
}

const StatDisplay = ({ value, label }: { value: string | number; label: string }) => (
    <div className="bg-pl-white/10 p-2 rounded-lg text-center flex flex-col justify-center">
        <p className="font-bold text-base text-pl-white leading-tight">{value}</p>
        <p className="text-[10px] text-pl-white/70 leading-tight mt-1">{label}</p>
    </div>
);


export const TransfersHeroCard: React.FC<TransfersHeroCardProps> = ({
  playersSelected,
  bank,
  notification,
  user,
  view,
  setView,
  gameweek,
  transferCount,
  transferCost,
}) => {
  const transfersText = user?.played_first_gameweek === false 
    ? "Unlimited" 
    : `${user?.free_transfers ?? 0} FT`;

  const deadlineDate = gameweek?.deadline ? new Date(gameweek.deadline) : null;
  const deadlineText = deadlineDate && isValid(deadlineDate)
    ? `Deadline: ${format(deadlineDate, "E dd MMM, HH:mm")}`
    : "Deadline: TBC";

  return (
    <Card className="overflow-hidden bg-pl-purple border-pl-border">
      <div className="p-4 text-pl-white">
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Transfers</h2>
            <p className="text-sm text-pl-white/70">
               Select a maximum of 2 players from a single team.
            </p>
          </div>

           <div className="bg-pl-white/10 rounded-lg p-3">
            <p className="font-bold text-center text-sm">
               {gameweek ? `Gameweek ${gameweek.gw_number}` : 'Current Gameweek'} • {deadlineText}
            </p>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            <StatDisplay value={`${playersSelected} / 11`} label="Players Selected" />
            <StatDisplay value={`£${bank.toFixed(1)}m`} label="Budget" />
            <StatDisplay value={transferCount > 0 ? `${transferCount}` : transfersText} label={transferCount > 0 ? "Transfers" : "Free Transfers"} />
            <StatDisplay value={`${transferCost} pts`} label="Cost" />
          </div>
          
          <div className="flex justify-center pt-2 bg-pl-white/10 p-1 rounded-lg">
            {user?.has_team && (
              <div className="grid grid-cols-2 gap-1 w-full">
                  <button
                      onClick={() => setView('pitch')}
                      className={cn(
                          "w-full py-2 text-sm font-semibold rounded-md transition-colors",
                          view === 'pitch' ? 'bg-pl-white text-pl-purple' : 'text-pl-white/70 hover:bg-pl-white/20'
                      )}
                  >
                      Pitch View
                  </button>
                  <button
                      onClick={() => setView('list')}
                      className={cn(
                          "w-full py-2 text-sm font-semibold rounded-md transition-colors",
                          view === 'list' ? 'bg-pl-white text-pl-purple' : 'text-pl-white/70 hover:bg-pl-white/20'
                      )}
                  >
                      List View
                  </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {notification && (
          <motion.div
             initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              "p-3 text-center font-semibold text-sm",
              notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-pl-green text-pl-purple'
            )}
          >
            {notification.message}
          </motion.div>
        )}
       </AnimatePresence>
    </Card>
  );
};