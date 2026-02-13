import React, { useEffect, useState } from 'react';
import { X, AlertTriangle, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getChipStatus, playChip, type ChipStatus } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

// ... imports remain the same ...
import wildcardIcon from '@/assets/images/chips/wildcard-transparent.png';
import tripleCaptainIcon from '@/assets/images/chips/triplecaptain-transparent.png';
import benchBoostIcon from '@/assets/images/chips/benchboost-transparent.png';
import freeHitIcon from '@/assets/images/chips/free-hit-transparent.png';
import wildcardIll from '@/assets/images/chips/wild-card.png';
import tripleCaptainIll from '@/assets/images/chips/triple-captain.png';
import benchBoostIll from '@/assets/images/chips/bench-boost.png';
import freeHitIll from '@/assets/images/chips/free-hit.png';

type ExtendedChipName = 'WILDCARD' | 'TRIPLE_CAPTAIN' | 'BENCH_BOOST' | 'FREE_HIT';

interface ExtendedChipStatus {
  active: ExtendedChipName | null;
  used: ExtendedChipName[];
}

const chips = [
  { 
    id: 'WILDCARD' as ExtendedChipName, 
    name: 'Wildcard', 
    icon: wildcardIcon,           
    illustration: wildcardIll,    
    description: 'The Wildcard allows you to make unlimited permanent transfers to your squad without any point deductions.',
  },
  { 
    id: 'TRIPLE_CAPTAIN' as ExtendedChipName, 
    name: 'Triple Captain', 
    icon: tripleCaptainIcon,
    illustration: tripleCaptainIll,
    description: 'Your Captain gets triple points instead of double points for this Gameweek only.',
  },
  { 
    id: 'BENCH_BOOST' as ExtendedChipName, 
    name: 'Bench Boost', 
    icon: benchBoostIcon,
    illustration: benchBoostIll,
    description: 'The points scored by your 4 bench players are included in your total score for this Gameweek.',
  },
  { 
    id: 'FREE_HIT' as ExtendedChipName, 
    name: 'Free Hit', 
    icon: freeHitIcon,
    illustration: freeHitIll,
    description: 'Make unlimited transfers for a single Gameweek. At the next deadline, your squad returns to its previous state.',
  },
];

type ChipItem = typeof chips[number];

export const GameweekChips: React.FC<{ 
  token: string; 
  gw?: number; 
  isFirstGameweek?: boolean;
  isLocked?: boolean;
}> = ({ token, gw, isFirstGameweek = false, isLocked = false }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [status, setStatus] = useState<ExtendedChipStatus>({ active: null, used: [] });
  const [selectedChip, setSelectedChip] = useState<ChipItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768); 
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await getChipStatus(token);
        setStatus(data as unknown as ExtendedChipStatus);
      } catch (error) {
        console.error('Failed to fetch chip status', error);
      }
    };
    fetchStatus();
  }, [token]);

  // --- NEW HANDLER: Intercept click to show Warning if Locked ---
  const handleChipClick = (chip: ChipItem, isUsed: boolean, isDisabled: boolean) => {
    if (isUsed) return; // Completely dead if used

    // If locked, show the error toast
    if (isLocked) {
        toast({
            variant: "destructive",
            title: "Gameweek Deadline Passed",
            description: "Chips cannot be played after the deadline. Please wait for the next gameweek.",
        });
        return;
    }

    // If otherwise disabled (e.g., restricted GW1 or another chip active), do nothing
    if (isDisabled) return;

    // Open Slider
    setSelectedChip(chip);
  };

  const executePlayChip = async () => {
    if (!selectedChip || !user) return;
    setLoading(true);
    try {
      await playChip(token, selectedChip.id as any);
      setStatus(prev => ({ ...prev, active: selectedChip.id }));
      toast({
        title: "Chip Activated",
        description: `${selectedChip.name} is now active for this gameweek.`,
        variant: "default", 
      });
      setSelectedChip(null); 
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to activate chip",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // --- MODIFIED: Priority Logic ---
  const getButtonText = (chipId: string, isActive: boolean, isUsed: boolean, isAnyActive: boolean, isRestricted: boolean) => {
    if (isActive) return "Active";
    if (isUsed) return "Used"; // "Used" now takes priority over "Locked"
    if (isRestricted) return "Unavailable for GW 1";
    if (isAnyActive && !isActive) return "Unavailable";
    
    // If simply locked but available otherwise, show Play (so they click it and get the error)
    return "Play";
  };

  const sidebarVariants = {
    hidden: isDesktop ? { x: "100%", y: 0 } : { y: "100%", x: 0 },
    visible: { x: 0, y: 0 },
    exit: isDesktop ? { x: "100%", y: 0 } : { y: "100%", x: 0 }
  };

  return (
    <>
      <div className="bg-gradient-to-br from-[#37003C] to-[#23003F] rounded-xl p-4 mb-6 shadow-md text-white relative overflow-hidden">
        

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {chips.map((chip) => {
            const isActive = status.active === chip.id;
            const isUsed = status.used.includes(chip.id) && !isActive;
            const isAnyActive = status.active !== null;
            
            const isRestricted = 
                (!user?.played_first_gameweek) && 
                (chip.id === 'WILDCARD' || chip.id === 'FREE_HIT');

            // --- LOGIC CHANGE: isLocked is NOT included in isDisabled anymore ---
            // This allows the click event to fire so we can show the toast.
            const isDisabled = isUsed || (isAnyActive && !isActive) || isRestricted;

            return (
              <div
                key={chip.id}
                className={cn(
                  "group flex flex-col items-center justify-between p-3 rounded-lg transition-all duration-300 min-h-[140px]",
                  isActive ? "bg-white/10 shadow-lg scale-105" : "bg-transparent",
                  !isDisabled && !isActive ? "hover:bg-white/5 hover:-translate-y-1" : ""
                )}
              >
                <div 
                  className={cn(
                    "flex flex-col items-center flex-grow justify-center w-full transition-opacity duration-300",
                    isDisabled && !isUsed ? "opacity-50" : "", 
                    isUsed ? "opacity-30 grayscale" : ""       
                  )}
                  onClick={() => handleChipClick(chip, isUsed, isDisabled)}
                  style={{ cursor: isUsed ? 'default' : 'pointer' }}
                >
                    <img 
                      src={chip.icon} 
                      alt={chip.name}
                      className={cn(
                          "w-12 h-12 object-contain mb-2 transition-transform duration-300",
                          "brightness-0 invert",
                          !isDisabled && !isActive && !isLocked && "group-hover:scale-110"
                      )}
                    />
                    <h4 className="text-[10px] sm:text-xs font-bold tracking-wide text-center leading-tight">
                      {chip.name}
                    </h4>
                </div>

                <button
                    type="button"
                    // Only disable HTML button if Used or Restricted. 
                    // If Locked, keep enabled to capture click.
                    disabled={isUsed || (isAnyActive && !isActive) || isRestricted} 
                    onClick={() => handleChipClick(chip, isUsed, isDisabled)}
                    className={cn(
                        "w-full mt-3 py-1.5 px-2 rounded text-[10px] font-bold  tracking-wider transition-all duration-300",
                        isActive 
                            ? "bg-gradient-to-r from-cyan-300 via-blue-600 to-purple-700 text-white shadow-md border-none opacity-100 cursor-default"
                            : "",
                        
                        (!isActive && isAnyActive) || isRestricted
                            ? "bg-transparent text-gray-400 border border-gray-600 cursor-not-allowed"
                            : "",
                        isUsed
                            ? "bg-transparent text-gray-500 border border-gray-700 cursor-not-allowed"
                            : "",
                        
                        // Play State (Includes Locked state visually)
                        !isActive && !isAnyActive && !isUsed && !isRestricted
                            ? "bg-transparent border border-white text-white hover:bg-white hover:text-[#38003c] shadow-sm"
                            : ""
                    )}
                >
                    {getButtonText(chip.id, isActive, isUsed, isAnyActive, isRestricted)}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {selectedChip && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
              onClick={() => setSelectedChip(null)}
            />
            
            <motion.div
              variants={sidebarVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={cn(
                "fixed z-50 bg-white shadow-2xl overflow-y-auto",
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
                  onClick={executePlayChip}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-300 via-blue-600 to-purple-700 hover:opacity-90 text-white font-black text-lg md:text-xl py-6 md:py-8 rounded-xl shadow-lg transition-all active:scale-95 tracking-widest mt-auto mb-4 border-none"
                >
                  {loading ? "Activating..." : `Play ${selectedChip.name}`}
                </Button>
                
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};