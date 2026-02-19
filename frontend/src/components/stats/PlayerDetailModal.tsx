import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import { getTeamLogo, getTeamJersey } from '@/lib/player-utils';
import { API } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

// --- SUB-COMPONENTS ---

const StatBox = ({ label, value }: { label: string; value: string | number }) => (
  <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-2 flex flex-col items-center justify-center text-center h-full">
    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 leading-tight">{label}</h3>
    <p className="text-base font-black text-black">{value}</p>
  </div>
);

const PastFixtureBox = ({ gw, opponentShort, opponentLong, isHome, points }: any) => (
  <div className="flex flex-col items-center justify-between p-2 bg-white border border-gray-200 rounded-lg shadow-sm h-full w-full">
    <div className="flex flex-col items-center w-full">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">GW{gw}</p>
        <div className="w-8 h-8 flex items-center justify-center mb-1">
          <img src={getTeamLogo(opponentShort)} alt={opponentLong} className="w-full h-full object-contain" />
        </div>
        <p className="text-[10px] font-bold text-gray-800 truncate w-full text-center" title={opponentLong}>
          {opponentShort}
        </p>
        <p className="text-[9px] font-bold text-gray-500">{isHome ? '(H)' : '(A)'}</p>
    </div>
    <div className="mt-2 w-full bg-black text-white text-[10px] font-bold text-center py-1 rounded">
       {points}pts
    </div>
  </div>
);

const getFdrColor = (fdr?: number) => {
  if (!fdr) return 'bg-gray-200 text-gray-800';
  if (fdr <= 2) return 'bg-[#01FC7A] text-black'; // FPL Green
  if (fdr === 3) return 'bg-[#EBEBE4] text-black'; // Gray
  if (fdr === 4) return 'bg-[#FF005A] text-white'; // Red
  if (fdr >= 5) return 'bg-[#80002E] text-white'; // Dark Red
  return 'bg-gray-200 text-gray-800';
};

const FutureFixtureBox = ({ gw, opponentShort, opponentLong, isHome, fdr }: any) => (
  <div className="flex flex-col items-center justify-between p-2 bg-white border border-gray-200 rounded-lg shadow-sm h-full w-full">
    <div className="flex flex-col items-center w-full">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">GW{gw}</p>
        <div className="w-8 h-8 flex items-center justify-center mb-1">
          <img src={getTeamLogo(opponentShort)} alt={opponentLong} className="w-full h-full object-contain" />
        </div>
        <p className="text-[10px] font-bold text-gray-800 truncate w-full text-center" title={opponentLong}>
          {opponentShort}
        </p>
        <p className="text-[9px] font-bold text-gray-500">{isHome ? '(H)' : '(A)'}</p>
    </div>
    <div className={`mt-2 w-full text-[10px] font-bold text-center py-1 rounded ${getFdrColor(fdr)}`}>
       {fdr || '-'}
    </div>
  </div>
);

const HistoryRow = ({ gw, opp, result, score, pts, ...stats }: any) => {
  // Determine badge styling based on result
  let badgeClass = "bg-white text-gray-800 border border-gray-300"; // Default / Draw
  if (result === 'W') badgeClass = "bg-[#029f4f] text-white border border-[#029f4f]"; // Victory
  if (result === 'L') badgeClass = "bg-[#E60023] text-white border border-[#E60023]"; // Loss

  return (
    <tr className="border-b border-gray-200 last:border-b-0 text-center text-sm font-semibold text-gray-700 hover:bg-white transition-colors">
      <td className="p-3 font-bold text-gray-900">{gw}</td>
      <td className="p-3 text-left">
        <div className="flex items-center gap-x-2">
          <img src={getTeamLogo(opp.substring(0, 3))} alt={opp} className="w-5 h-5 object-contain" />
          <span>{opp}</span>
        </div>
      </td>
      {/* RESULT COLUMN WITH SCORE */}
      <td className="p-3">
        <div className={`inline-flex items-center justify-center w-14 py-1.5 rounded text-xs font-bold tracking-wider ${badgeClass}`}>
          {score || result}
        </div>
      </td>
      <td className="p-3 font-black text-black">{pts}</td>
      <td className="p-3 text-gray-500">{stats.gs}</td>
      <td className="p-3 text-gray-500">{stats.a}</td>
      <td className="p-3 text-gray-500">{stats.cs}</td>
      <td className="p-3 text-gray-500">{stats.gc}</td>
      <td className="p-3 text-gray-500">{stats.yc}</td>
      <td className="p-3 text-gray-500">{stats.rc}</td>
    </tr>
  );
};

const ModalSkeleton = () => (
  <div className="space-y-6">
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
      <div className="grid grid-cols-3 lg:grid-cols-7 gap-2">
        {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-[60px] w-full rounded-lg" />)}
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-4">
            <Skeleton className="h-5 w-1/4" />
            <div className="grid grid-cols-4 gap-2">
                {[...Array(4)].map((_, j) => <Skeleton key={j} className="h-[110px] w-full rounded-lg" />)}
            </div>
            </div>
        ))}
    </div>
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-4">
      <Skeleton className="h-6 w-1/4" />
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
      </div>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

interface PlayerDetailModalProps {
  player: any;
  isOpen: boolean;
  onClose: () => void;
}

export const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({ player, isOpen, onClose }) => {
  const [details, setDetails] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isOpen && player?.id) {
      const fetchDetails = async () => {
        setIsLoading(true);
        setError(null);
        setDetails(null);
        try {
          const token = localStorage.getItem("access_token");
          const response = await fetch(API.endpoints.playerDetails(player.id), {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (!response.ok) throw new Error('Failed to fetch player details.');
          const data = await response.json();
          setDetails(data);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchDetails();
    }
  }, [isOpen, player?.id]);

  const slideVariants = isDesktop
    ? { hidden: { x: '100%' }, visible: { x: 0 }, exit: { x: '100%' } }
    : { hidden: { y: '100%' }, visible: { y: 0 }, exit: { y: '100%' } };

  // Helper variables for layout and calculations
  const status = details?.status || player?.status;
  const chance = details?.chance_of_playing || player?.chance_of_playing;
  const hasWarning = status && status !== 'ACTIVE';
  const isYellowWarning = chance !== undefined && chance !== null && chance > 0 && chance <= 75;
  const bannerBgClass = isYellowWarning ? 'bg-yellow-100 text-yellow-900 border-yellow-400' : 'bg-[#B2002D] text-white border-[#B2002D]';
  const iconColor = isYellowWarning ? 'text-yellow-600' : 'text-white';
  const returnDateStr = (details?.return_date || player?.return_date)
    ? new Date(details?.return_date || player?.return_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : null;

  // Safe fallback math for the new stat fields
  const totalBonus = details?.history?.reduce((acc: number, curr: any) => acc + (curr.bonus || curr.bps || 0), 0) || 0;
  const formVal = details?.form || (details?.history?.slice(0,5).reduce((acc: number, curr: any) => acc + (curr.pts || 0), 0) / Math.min(details?.history?.length || 1, 5)).toFixed(1);
  const selectedPct = details?.selected_by_percent ? `${details.selected_by_percent}%` : '0.0%';
  const currentGwNumber = details?.history?.[0]?.gw || '-';
  const currentGwPts = details?.history?.[0]?.pts ?? 0;

  return (
    <AnimatePresence>
      {isOpen && player && (
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
                ? 'top-0 right-0 bottom-0 w-[850px] rounded-l-2xl' // Slightly wider to comfortably fit the extra result column
                : 'bottom-0 left-0 right-0 max-h-[90vh] rounded-t-3xl'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* --- HEADER --- */}
            <div className="relative p-6 pb-4 border-b border-gray-100 shrink-0">
              <button 
                onClick={onClose} 
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
              
              <div className="flex items-center gap-4 mb-2">
                <img 
                  src={getTeamJersey(details?.team_name || player.team)} 
                  alt="Jersey" 
                  className="w-10 h-12 object-contain" 
                />
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    {details?.position || player.pos} • {details?.team_name || player.team}
                  </p>
                  <h2 className="text-2xl font-black text-black leading-tight">
                    {details?.full_name || player.name}
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
                    {(details?.news || player?.news) && <p className="text-xs mt-1 opacity-90">{details?.news || player?.news}</p>}
                    {returnDateStr && <p className="text-xs mt-1 font-semibold opacity-90">Expected Return: {returnDateStr}</p>}
                  </div>
                </div>
              )}
            </div>

            {/* --- BODY --- */}
            <div className="flex-1 overflow-y-auto p-6 bg-white">
              {isLoading ? (
                <ModalSkeleton />
              ) : error ? (
                <div className="text-center text-red-500 font-bold p-8 bg-red-50 rounded-xl">{error}</div>
              ) : details ? (
                <div className="space-y-6">
                  
                  {/* Top 7 Stats Grid */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="grid grid-cols-3 lg:grid-cols-7 gap-2">
                      <StatBox label="Price" value={`£${details.price?.toFixed(1) || '0.0'}m`} />
                      <StatBox label="Form" value={formVal} />
                      <StatBox label="Pts / Match" value={details.history?.length > 0 ? (details.total_points / details.history.length).toFixed(1) : '0.0'} />
                      <StatBox label={`GW${currentGwNumber} Pts`} value={currentGwPts} />
                      <StatBox label="Total Pts" value={details.total_points} />
                      <StatBox label="Total Bonus" value={totalBonus} />
                      <StatBox label="TSB %" value={selectedPct} />
                    </div>
                  </div>

                  {/* Form & Fixtures Split */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Form Section */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <h3 className="text-sm font-bold text-black mb-4">Form</h3>
                      {/* Changed to 4 columns and removed broken h-[100px] limit */}
                      <div className="grid grid-cols-4 gap-2">
                        {details.history?.slice(0, 4).reverse().map((fx: any) => 
                          <PastFixtureBox 
                            key={`past-${fx.gw}`} 
                            gw={fx.gw} 
                            isHome={fx.opp?.includes('(H)') || fx.ha === 'H'} 
                            opponentShort={fx.opp?.substring(0,3) || fx.opp} 
                            opponentLong={fx.opp} 
                            points={fx.pts}
                          />
                        )}
                        {(!details.history || details.history.length === 0) && (
                          <div className="col-span-4 flex items-center justify-center p-4">
                            <p className="text-sm text-gray-500 font-semibold">No recent form.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Fixtures Section */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <h3 className="text-sm font-bold text-black mb-4">Fixtures</h3>
                      {/* Changed to 4 columns and removed broken h-[100px] limit */}
                      <div className="grid grid-cols-4 gap-2">
                        {details.upcoming_fixtures?.slice(0, 4).map((fx: any) => 
                          <FutureFixtureBox 
                            key={`future-${fx.gw}`} 
                            gw={fx.gw} 
                            isHome={fx.is_home} 
                            opponentShort={fx.opp_short} 
                            opponentLong={fx.opp_long} 
                            fdr={fx.difficulty || fx.fdr} 
                          />
                        )}
                        {(!details.upcoming_fixtures || details.upcoming_fixtures.length === 0) && (
                           <div className="col-span-4 flex items-center justify-center p-4">
                            <p className="text-sm text-gray-500 font-semibold">No upcoming fixtures.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Season History Table */}
                  {details.history?.length > 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 overflow-hidden flex flex-col">
                      <h3 className="text-lg font-bold text-black mb-4 shrink-0">This Season</h3>
                      
                      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                        <table className="w-full text-left min-w-[550px]">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr className="text-[10px] text-gray-500 uppercase tracking-wider text-center">
                              <th className="p-3 font-bold">GW</th>
                              <th className="p-3 font-bold text-left">OPP</th>
                              <th className="p-3 font-bold">RESULT</th>
                              <th className="p-3 font-bold">PTS</th>
                              <th className="p-3 font-bold">GS</th>
                              <th className="p-3 font-bold">A</th>
                              <th className="p-3 font-bold">CS</th>
                              <th className="p-3 font-bold">GC</th>
                              <th className="p-3 font-bold">YC</th>
                              <th className="p-3 font-bold">RC</th>
                            </tr>
                          </thead>
                          <tbody>
                            {details.history.map((row: any) => <HistoryRow key={`hr-${row.gw}`} {...row} />)}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              ) : null}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PlayerDetailModal;