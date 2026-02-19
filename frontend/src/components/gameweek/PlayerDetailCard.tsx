import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
// --- 1. IMPORT getTeamLogo ---
import { getTeamJersey, getTeamLogo } from '@/lib/player-utils';

interface PlayerDetailCardProps {
  player: any;
  onClose: () => void;
  activeChip?: string | null;
  isEffectiveCaptain?: boolean; 
}

export const PlayerDetailCard: React.FC<PlayerDetailCardProps> = ({ 
  player, 
  onClose, 
  activeChip,
  isEffectiveCaptain
}) => {
  const navigate = useNavigate();
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!player) return null;

  const determineMultiplier = () => {
    const stats = player.raw_stats || player.stats || {};
    const didPlay = (player.points !== 0) || (stats.played === true) || (stats.minutes > 0);
    const isCap = player.is_captain || player.isCaptain;
    
    let getsBonus = false;
    if (isEffectiveCaptain !== undefined) {
      getsBonus = isEffectiveCaptain;
    } else {
      getsBonus = isCap;
    }

    if (getsBonus) {
      return activeChip === 'TRIPLE_CAPTAIN' ? 3 : 2;
    }
    return 1;
  };

  const multiplier = determineMultiplier();

  const slideVariants = isDesktop
    ? { hidden: { x: '100%' }, visible: { x: 0 }, exit: { x: '100%' } }
    : { hidden: { y: '100%' }, visible: { y: 0 }, exit: { y: '100%' } };

  const status = player.status;
  const chance = player.chance_of_playing;
  const hasWarning = status && status !== 'ACTIVE';
  const isYellowWarning = chance !== undefined && chance !== null && chance > 0 && chance <= 75;
  const bannerBgClass = isYellowWarning ? 'bg-yellow-100 text-yellow-900 border-yellow-400' : 'bg-[#B2002D] text-white border-[#B2002D]';
  const iconColor = isYellowWarning ? 'text-yellow-600' : 'text-white';

  const returnDateStr = player.return_date
    ? new Date(player.return_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : null;

  const recentFixture = player.recent_fixtures?.[0] || null;
  
  // --- 2. LOGIC TO INJECT MISSING BREAKDOWN STATS ---
  const augmentedBreakdown = useMemo(() => {
    let newBreakdown = player.breakdown || [];
    const stats = player.raw_stats || {};
    const position = player.position || player.pos;

    // Check if Goals Conceded stat exists in raw stats but not in breakdown
    if (stats.goals_conceded > 0 && !newBreakdown.some((s: any) => s.label === "Goals Conceded")) {
      let points = 0;
      // Apply scoring rule only for GK and DEF
      if (position === 'GK' || position === 'DEF') {
        points = Math.floor(stats.goals_conceded / 2) * -1;
      }
      
      if (points !== 0) {
        newBreakdown.push({
          label: "Goals Conceded",
          value: stats.goals_conceded,
          points: points
        });
      }
    }
    return newBreakdown;
  }, [player.breakdown, player.raw_stats, player.position, player.pos]);


  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-[60]"
        onClick={onClose}
      />

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
        <div className="relative p-6 pb-4 border-b border-gray-100">
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
          
          <div className="flex items-center gap-4 mb-2">
            <img src={getTeamJersey(player.team?.name || player.team)} alt="Jersey" className="w-10 h-12 object-contain" />
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{player.position || player.pos}</p>
              <h2 className="text-2xl font-black text-black leading-tight">{player.full_name || player.name}</h2>
            </div>
          </div>

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

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-800 mb-3 text-center">Current Fixture</h3>
            {recentFixture ? (
              // --- 3. UPDATED JSX FOR FIXTURE DISPLAY ---
              <div className="flex justify-between items-center gap-2 font-bold text-lg">
                <div className="flex items-center gap-2 flex-1 justify-end">
                    <span className="text-gray-900 text-right">{player.team?.name || player.team}</span>
                    <img src={getTeamLogo(player.team?.short_name)} alt={player.team?.name} className="w-8 h-8 object-contain" />
                </div>
                <span className="bg-black text-white px-3 py-1 rounded-md text-sm">
                  vs
                </span>
                <div className="flex items-center gap-2 flex-1 justify-start">
                    <img src={getTeamLogo(recentFixture.opp)} alt={recentFixture.opp} className="w-8 h-8 object-contain" />
                    <span className="text-gray-900 text-left">{recentFixture.opp} ({recentFixture.ha})</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center">No current fixture data available.</p>
            )}
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <h3 className="text-lg font-bold text-black mb-4">Points breakdown</h3>
            
            <div className="grid grid-cols-4 gap-4 pb-2 border-b border-gray-300 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              <div className="col-span-2">Statistic</div>
              <div className="text-center">Value</div>
              <div className="text-right">Points</div>
            </div>

            <div className="space-y-3 mt-3">
              {/* --- 4. USE THE NEW AUGMENTED ARRAY --- */}
              {augmentedBreakdown.length > 0 ? augmentedBreakdown.map((stat: any, index: number) => {
                if (stat.value === 0 && stat.points === 0) return null;
                
                return (
                  <div key={index} className="grid grid-cols-4 gap-4 text-sm font-semibold items-center">
                    <div className="col-span-2 text-gray-800">{stat.label}</div>
                    <div className="text-center text-gray-600">{stat.value}</div>
                    <div className="text-right text-black">{stat.points * multiplier} pts</div>
                  </div>
                );
              }) : (
                <p className="text-sm text-gray-500 text-center py-4">No points data for this gameweek.</p>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-300 grid grid-cols-4 gap-4 font-black text-base text-black">
              <div className="col-span-3 text-right flex items-center justify-end gap-2">
                Total
                {multiplier > 1 && (
                  <span className="bg-pl-purple text-white text-[10px] px-1.5 py-0.5 rounded">
                    {multiplier}x
                  </span>
                )}
              </div>
              <div className="text-right">{(player.points || 0) * multiplier} pts</div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-white">
          <Button 
            className="w-full h-12 text-base font-bold bg-black text-white hover:bg-gray-800 rounded-xl"
            onClick={() => {
              onClose();
              navigate('/stats');
            }}
          >
            View full profile
          </Button>
        </div>
      </motion.div>
    </>
  );
};