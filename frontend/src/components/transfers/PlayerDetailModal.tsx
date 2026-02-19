import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTeamJersey } from '@/lib/player-utils';

interface PlayerDetailModalProps {
  player: any | null;
  onClose: () => void;
  onRemove?: () => void;
  onTransfer?: (player: any) => void;
}

export const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({ 
  player, 
  onClose, 
  onRemove, 
  onTransfer 
}) => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const slideVariants = isDesktop
    ? { hidden: { x: '100%' }, visible: { x: 0 }, exit: { x: '100%' } }
    : { hidden: { y: '100%' }, visible: { y: 0 }, exit: { y: '100%' } };

  // Helper variables for the status banner
  const status = player?.status;
  const chance = player?.chance_of_playing;
  const hasWarning = status && status !== 'ACTIVE';
  const isYellowWarning = chance !== undefined && chance !== null && chance > 0 && chance <= 75;
  const bannerBgClass = isYellowWarning ? 'bg-yellow-100 text-yellow-900 border-yellow-400' : 'bg-[#B2002D] text-white border-[#B2002D]';
  const iconColor = isYellowWarning ? 'text-yellow-600' : 'text-white';

  const returnDateStr = player?.return_date
    ? new Date(player.return_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : null;

  return (
    <AnimatePresence>
      {player && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[60]"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            variants={slideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed z-[70] bg-white shadow-2xl flex flex-col ${
              isDesktop 
                ? 'top-0 right-0 bottom-0 w-[420px] rounded-l-2xl' 
                : 'bottom-0 left-0 right-0 max-h-[85vh] rounded-t-3xl'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* --- HEADER --- */}
            <div className="relative p-6 pb-4 border-b border-gray-100">
              <button 
                onClick={onClose} 
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
              
              <div className="flex items-center gap-4 mb-2">
                <img 
                    src={getTeamJersey(player.club || player.teamName || player.team)} 
                    alt="Jersey" 
                    className="w-10 h-12 object-contain" 
                />
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    {player.pos} • {player.club || player.teamName || player.team}
                  </p>
                  <h2 className="text-2xl font-black text-black leading-tight">
                    {player.name || player.full_name}
                  </h2>
                </div>
              </div>

              {/* Status Banner */}
              {hasWarning && (
                <div className={`mt-4 p-3 rounded-lg border flex items-start gap-3 ${bannerBgClass}`}>
                  <AlertTriangle className={`w-5 h-5 mt-0.5 shrink-0 ${iconColor}`} />
                  <div className="flex-1">
                    <p className="font-bold text-sm">
                      {status === 'INJURED' ? 'Injured' : 
                       status === 'SUSPENDED' ? 'Suspended' : 
                       status === 'UNAVAILABLE' ? 'Unavailable' : 'Doubtful'}
                      {chance !== null && chance !== undefined && ` - ${chance}% chance`}
                    </p>
                    {player.news && <p className="text-xs mt-1 opacity-90">{player.news}</p>}
                    {returnDateStr && <p className="text-xs mt-1 font-semibold opacity-90">Expected Return: {returnDateStr}</p>}
                  </div>
                </div>
              )}
            </div>

            {/* --- BODY --- */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Price Tag */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Current Price</h3>
                <p className="text-3xl font-black text-black">£{player.price?.toFixed(1)}m</p>
              </div>

              {/* Recent Form / Fixtures */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <h3 className="text-lg font-bold text-black mb-4">Recent Form</h3>
                
                <div className="grid grid-cols-4 gap-4 pb-2 border-b border-gray-300 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  <div className="col-span-1">GW</div>
                  <div className="col-span-2">Opponent</div>
                  <div className="text-right">Points</div>
                </div>

                <div className="space-y-3 mt-3">
                  {player.recent_fixtures && player.recent_fixtures.length > 0 ? (
                    player.recent_fixtures.slice(0, 5).map((fx: any, idx: number) => (
                      <div key={`fx-${idx}`} className="grid grid-cols-4 gap-4 text-sm font-semibold items-center">
                        <div className="col-span-1 text-gray-500">GW{fx.gw}</div>
                        <div className="col-span-2 text-gray-900">{fx.opp} ({fx.ha})</div>
                        <div className="text-right text-black">{fx.points ?? 0} pts</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No recent fixture data available.</p>
                  )}
                </div>
              </div>
            </div>

            {/* --- FOOTER ACTIONS --- */}
            <div className="p-6 border-t border-gray-100 bg-white space-y-3 shrink-0">
              {onTransfer && (
                <Button 
                  className="w-full h-12 text-base font-bold bg-black text-white hover:bg-gray-800 rounded-xl"
                  onClick={() => {
                    onTransfer(player);
                    onClose();
                  }}
                >
                  Transfer Player
                </Button>
              )}
              
              {onRemove && (
                <Button 
                  variant="outline"
                  className="w-full h-12 text-base font-bold text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 rounded-xl"
                  onClick={onRemove}
                >
                  Remove from Squad
                </Button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PlayerDetailModal;