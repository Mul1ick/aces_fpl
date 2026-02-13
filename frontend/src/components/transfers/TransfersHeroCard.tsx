import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format, isValid } from 'date-fns';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// --- NEW IMPORT: Use the shared hook ---
import { useChipStatus } from '@/hooks/useChipStatus';

// --- CHIP IMAGES ---
import wildcardIcon from '@/assets/images/chips/wild-card.png';
import freeHitIcon from '@/assets/images/chips/free-hit.png';
import wildcardIll from '@/assets/images/chips/wild-card.png';
import freeHitIll from '@/assets/images/chips/free-hit.png';

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
  chipStatus: { active: string | null; used: string[] } | null;
  onActivateChip?: (chip: 'WILDCARD' | 'FREE_HIT') => Promise<void>; 
  isChipLoading?: boolean;
  isLocked?: boolean;
}

// --- CHIP DETAILS FOR SLIDER ---
const chipDetails = {
  WILDCARD: {
    id: 'WILDCARD' as const,
    name: 'Wildcard',
    illustration: wildcardIll,
    description: 'The Wildcard allows you to make unlimited permanent transfers to your squad without any point deductions.',
  },
  FREE_HIT: {
    id: 'FREE_HIT' as const,
    name: 'Free Hit',
    illustration: freeHitIll,
    description: 'Make unlimited transfers for a single Gameweek. At the next deadline, your squad returns to its previous state.',
  }
};

type SelectedChipType = typeof chipDetails[keyof typeof chipDetails];

// --- STAT ITEM ---
const StatItem = ({ value, label, isPill = false }: { value: string | number; label: string; isPill?: boolean }) => (
  <div className="flex flex-col items-center justify-start text-center flex-1">
    <div className={cn(
      "font-black text-sm sm:text-lg leading-none py-1.5 px-2 sm:px-3 rounded-lg mb-1 whitespace-nowrap min-w-[3rem]",
      isPill ? "bg-black text-white shadow-sm" : "text-black"
    )}>
      {value}
    </div>
    <div className="text-[9px] sm:text-[10px] text-gray-500 font-semibold leading-tight">{label}</div>
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
  isLocked = false
}) => {
  const [selectedChip, setSelectedChip] = useState<SelectedChipType | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const { toast } = useToast();
  
  const { activeChip, usedChips, activateChip, isActivating } = useChipStatus();

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768); 
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const handleChipClick = (chip: SelectedChipType, isUsed: boolean, isDisabled: boolean) => {
    if (isUsed) return;

    if (isLocked) {
        toast({
            variant: "destructive",
            title: "Gameweek Deadline Passed",
            description: "Chips cannot be played after the deadline. Please wait for the next gameweek.",
        });
        return;
    }

    if (isDisabled) return;

    setSelectedChip(chip);
  };

  const handleConfirmActivation = () => {
    if (selectedChip) {
      activateChip(selectedChip.id, {
        onSuccess: () => {
          setSelectedChip(null);
        }
      });
    }
  };

  const isChipActive = activeChip === 'WILDCARD' || activeChip === 'FREE_HIT';

  const getTransfersText = () => {
    if (isChipActive || user?.played_first_gameweek === false) {
      return "Unlimited";
    }
    return `${user?.free_transfers ?? 0}`;
  };

  const transfersText = getTransfersText();
  const deadlineDate = gameweek?.deadline ? new Date(gameweek.deadline) : null;
  const deadlineText = deadlineDate && isValid(deadlineDate)
    ? `Deadline: ${format(deadlineDate, "E dd MMM, HH:mm")}`
    : "Deadline: TBC";

  const displayTransfersValue = isChipActive ? "Unlimited" : (transferCount > 0 ? transferCount : transfersText);
  const displayCostValue = isChipActive ? 0 : transferCost;

  const renderChip = (chipId: 'WILDCARD' | 'FREE_HIT', name: string, icon: string) => {
    const isActive = activeChip === chipId;
    const isUsed = usedChips.includes(chipId);
    const anyActive = activeChip !== null && activeChip !== undefined;
    const isRestricted = !user?.played_first_gameweek;

    const isUnavailable = (anyActive && !isActive) || isRestricted || (isLocked && !isActive);

    if (isUsed || isUnavailable) {
      return (
        <div className="flex flex-col items-center justify-center p-2 w-[90px] sm:w-[110px] h-[90px] transition-all">
          <img
              src={icon}
              alt={name}
              className="w-6 h-6 sm:w-8 sm:h-8 object-contain mb-1.5 opacity-30 grayscale"
          />
          <span className="text-[9px] sm:text-[10px] font-bold tracking-wide text-gray-400 mb-0.5">{name}</span>
          <span className="text-[9px] sm:text-[10px] font-semibold text-gray-500">
            {isUsed ? 'Used' : isLocked ? 'Locked' : 'Unavailable'}
          </span>
        </div>
      );
    }

    return (
      <div className={cn(
        "flex flex-col items-center justify-between border rounded-xl p-2 w-[90px] sm:w-[110px] h-[90px] transition-all",
        isActive ? "border-transparent bg-white shadow-md ring-1 ring-black/5" : "border-gray-200 bg-white"
      )}>
        <div className="flex flex-col items-center mb-1">
            <img
                src={icon}
                alt={name}
                className="w-6 h-6 sm:w-8 sm:h-8 object-contain mb-1"
            />
            <span className="text-[9px] sm:text-[10px] font-bold tracking-wide text-black">{name}</span>
        </div>
        <button
          onClick={() => handleChipClick(chipDetails[chipId], isUsed, isUnavailable)}
          disabled={isActive || isActivating || isUsed}
          className={cn(
            "w-full text-[9px] sm:text-[10px] font-bold rounded-full py-1 transition-all",
            // --- UPDATED: This block now matches the GameweekChips style exactly ---
            isActive
                ? "bg-gradient-to-r from-cyan-300 via-blue-600 to-purple-700 text-white shadow-md border-none opacity-100 cursor-default"
                : "bg-transparent text-black border border-black hover:bg-black hover:text-white"
          )}
        >
          {isActive ? 'Active' : 'Play'}
        </button>
      </div>
    );
  };

  const sidebarVariants = {
    hidden: isDesktop ? { x: "100%", y: 0 } : { y: "100%", x: 0 },
    visible: { x: 0, y: 0 },
    exit: isDesktop ? { x: "100%", y: 0 } : { y: "100%", x: 0 }
  };

  return (
    <>
      <Card className="overflow-hidden bg-white text-black border-none shadow-sm rounded-xl mb-4 relative z-10">
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">Transfers</h2>
              <p className="text-[10px] sm:text-xs text-gray-500 font-medium mt-0.5">
                 Select a maximum of 2 players from a single team.
              </p>
            </div>

            {user?.has_team && (
              <div className="hidden md:flex gap-2">
                <button
                    onClick={() => setView('pitch')}
                    className={cn(
                        "px-3 py-1.5 text-xs font-bold rounded-lg transition-all border",
                        view === 'pitch' ? 'bg-black text-white border-black shadow-sm' : 'bg-transparent text-gray-500 border-transparent hover:bg-gray-100 hover:text-black'
                    )}
                >
                    Pitch View
                </button>
                <button
                    onClick={() => setView('list')}
                    className={cn(
                        "px-3 py-1.5 text-xs font-bold rounded-lg transition-all border",
                        view === 'list' ? 'bg-black text-white border-black shadow-sm' : 'bg-transparent text-gray-500 border-transparent hover:bg-gray-100 hover:text-black'
                    )}
                >
                    List View
                </button>
              </div>
            )}
          </div>

          <div className="text-center flex justify-center">
            <p className="font-bold text-[10px] sm:text-xs text-black">
               {gameweek ? `Gameweek ${gameweek.gw_number}` : 'Current Gameweek'} <span className="text-gray-300 mx-1.5 sm:mx-2">•</span> {deadlineText}
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3 md:gap-6 w-full mt-1">
            {user?.has_team && (
                <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto shrink-0 justify-center">
                  {renderChip('WILDCARD', 'Wildcard', wildcardIcon)}
                  {renderChip('FREE_HIT', 'Free Hit', freeHitIcon)}
                </div>
            )}

            <div className="flex flex-row items-center justify-between w-full flex-1 gap-1 sm:gap-3">
              <StatItem value={`${playersSelected} / 11`} label="Players Selected" isPill />
              <StatItem value={`£${bank.toFixed(1)}m`} label="Budget" isPill />
              <StatItem value={displayTransfersValue} label={transferCount > 0 && !isChipActive ? "Transfers" : "Free Transfers"} />
              <StatItem value={`${displayCostValue} pts`} label="Cost" />
            </div>
          </div>

          {user?.has_team && (
            <div className="flex md:hidden bg-gray-100 p-1 rounded-lg border border-gray-200 mt-2">
                <button
                    onClick={() => setView('pitch')}
                    className={cn(
                        "flex-1 py-1.5 text-xs font-bold rounded-md transition-all",
                        view === 'pitch' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-black'
                    )}
                >
                    Pitch View
                </button>
                <button
                    onClick={() => setView('list')}
                    className={cn(
                        "flex-1 py-1.5 text-xs font-bold rounded-md transition-all",
                        view === 'list' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-black'
                    )}
                >
                    List View
                </button>
            </div>
          )}
        </div>

        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={cn(
                "p-2.5 text-center font-bold text-xs sm:text-sm tracking-wide",
                notification.type === 'error' ? 'bg-[#B2002D] text-white' : 'bg-black text-white'
              )}
            >
              {notification.message}
            </motion.div>
          )}
         </AnimatePresence>
      </Card>

      <AnimatePresence>
        {selectedChip && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
              onClick={() => setSelectedChip(null)}
            />
            
            <motion.div
              variants={sidebarVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={cn(
                "fixed z-[70] bg-white shadow-2xl overflow-y-auto",
                "bottom-0 left-0 right-0 w-full rounded-t-[2rem] max-h-[90vh]",
                "md:top-0 md:right-0 md:left-auto md:bottom-auto", 
                "md:h-full md:w-[30%] md:min-w-[400px] md:max-h-full", 
                "md:rounded-none md:rounded-l-3xl"
              )}
            >
              <div className="p-8 h-full flex flex-col items-center text-center text-black relative">
                
                <button 
                  onClick={() => setSelectedChip(null)}
                  className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>

                <div className="mt-4 md:mt-8 mb-4">
                   <img 
                    src={selectedChip.illustration} 
                    alt={selectedChip.name}
                    className="w-32 h-32 md:w-36 md:h-36 object-contain drop-shadow-xl"
                   />
                </div>

                <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-2 text-[#38003c]">
                  {selectedChip.name}
                </h2>

                <div className="mb-6 max-w-sm mx-auto">
                    <p className="text-gray-800 text-base md:text-lg font-medium leading-relaxed">
                        {selectedChip.description}
                    </p>
                </div>

                <div className="bg-gray-100 rounded-xl p-4 w-full mb-8">
                    <h4 className="flex items-center justify-center gap-2 text-sm font-bold text-gray-700 mb-2 tracking-wider">
                        <AlertTriangle className="w-4 h-4 text-black" /> Important
                    </h4>
                    <ul className="text-left text-sm space-y-1 text-gray-600 mx-auto max-w-[90%] list-disc pl-4">
                        <li>Once activated, this chip <strong>cannot be cancelled</strong>.</li>
                        <li>You only get <strong>one</strong> {selectedChip.name} per season.</li>
                    </ul>
                </div>

                <Button 
                  onClick={handleConfirmActivation}
                  disabled={isActivating}
                  className="w-full bg-gradient-to-r from-cyan-300 via-blue-600 to-purple-700 hover:opacity-90 text-white font-black text-lg md:text-xl py-6 md:py-8 rounded-xl shadow-lg transition-all active:scale-95 tracking-widest mt-auto mb-4 border-none"
                >
                  {isActivating ? "Activating..." : `Play ${selectedChip.name}`}
                </Button>
                
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};