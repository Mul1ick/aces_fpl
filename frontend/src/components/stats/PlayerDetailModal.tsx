import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { X } from 'lucide-react';
import { getTeamLogo, getTeamJersey } from '@/lib/player-utils';
import { API } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

// --- SUB-COMPONENTS for the Modal ---

const StatBox = ({ label, value }: { label: string; value: string | number }) => (
    <div className="text-center bg-gray-100 p-2 rounded-lg">
        <p className="text-lg font-bold text-black">{value}</p>
        <p className="text-xs text-gray-600">{label}</p>
    </div>
);

// MODIFIED: This component now receives full and short names
const FixtureBox = ({ opponentShort, opponentLong, isHome, gw }: { opponentShort: string; opponentLong: string; isHome: boolean; gw: number }) => (
    <div className="text-center space-y-1 flex flex-col items-center">
        {/* Use the long name for display */}
        <p className="text-xs font-bold text-gray-700 truncate" title={opponentLong}>{opponentShort} {isHome ? '(H)' : '(A)'}</p>
        <div className='w-10 h-10 flex items-center justify-center p-1'>
            {/* Use the short name for the logo utility */}
            <img src={getTeamLogo(opponentShort)} alt={opponentLong} className="w-full h-full object-contain" />
        </div>
        <p className="text-xs text-gray-500">GW{gw}</p>
    </div>
);


const HistoryRow = ({ gw, opp, result, pts, ...stats }: any) => (
    <tr className="border-b border-gray-200 last:border-b-0 text-center text-sm text-gray-800">
        <td className="p-2 font-bold">{gw}</td>
        <td className="p-2 text-left">
            <div className="flex items-center gap-x-2">
                <img src={getTeamLogo(opp.substring(0, 3))} alt={opp} className="w-5 h-5" />
                <span>{opp} <span className={`font-bold ${result === 'W' ? 'text-green-500' : result === 'L' ? 'text-red-500' : 'text-gray-500'}`}>{result}</span></span>
            </div>
        </td>
        <td className="p-2 font-bold text-black">{pts}</td>
        <td className="p-2">{stats.mp}</td>
        <td className="p-2">{stats.gs}</td>
        <td className="p-2">{stats.a}</td>
        <td className="p-2">{stats.cs}</td>
        <td className="p-2">{stats.gc}</td>
        <td className="p-2">{stats.yc}</td>
        <td className="p-2">{stats.rc}</td>
    </tr>
);

const ModalSkeleton = () => (
    <div className="p-6 space-y-6">
        <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[58px] w-full" />)}
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 space-y-4">
            <Skeleton className="h-6 w-1/2" />
            <div className="grid grid-cols-5 gap-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 space-y-2">
            <Skeleton className="h-6 w-1/3 mb-2" />
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
    </div>
);


// --- MAIN COMPONENT ---
interface PlayerDetailModalProps {
  player: any; // The basic player info passed in
  isOpen: boolean;
  onClose: () => void;
}

export const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({ player, isOpen, onClose }) => {
  const [details, setDetails] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          if (!response.ok) {
            throw new Error('Failed to fetch player details.');
          }
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

  if (!player) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent hideCloseButton className="bg-white text-black w-full md:w-1/2 p-0 flex flex-col overflow-hidden md:max-w-none">
        {/* Header */}
        <div className="flex-shrink-0 p-6 bg-dashboard-gradient text-white relative">
            <div className="flex items-center space-x-4">
                <div className="w-24 h-24 flex items-center justify-center">
                    <img 
                        src={getTeamJersey(details?.team_name || player.team)} 
                        alt={`${details?.team_name || player.team} logo`} 
                        className="w-20 h-20 object-contain" 
                    />
                </div>
                <div>
                    <p className="font-semibold text-white/80">{details?.position || player.pos}</p>
                    <h2 className="text-3xl font-extrabold text-white">{details?.full_name || player.name}</h2>
                    <p className="font-bold text-white/90">{details?.team_name || player.team}</p>
                </div>
            </div>
            <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/10 rounded-full p-1 transition-colors">
                <X className="h-6 w-6" />
                <span className="sr-only">Close</span>
            </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-gray-50">
            {isLoading ? (
              <ModalSkeleton />
            ) : error ? (
              <div className="text-center text-red-500">{error}</div>
            ) : details ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatBox label="Price" value={`£${details.price.toFixed(1)}m`} />
                    <StatBox label="Pts / Match" value={details.history.length > 0 ? (details.total_points / details.history.length).toFixed(1) : '0.0'} />
                    <StatBox label="GW Points" value={details.history[0]?.pts ?? 0} />
                    <StatBox label="Total Pts" value={details.total_points} />
                </div>

                {details.upcoming_fixtures.length > 0 && (
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
                        <h3 className="text-xl font-bold text-black mb-4">Upcoming Fixtures</h3>
                        <div className="grid grid-cols-5 gap-2">
                            {/* MODIFIED: Pass the correct props to FixtureBox */}
                            {details.upcoming_fixtures.map((fixture: any) => 
                                <FixtureBox 
                                    key={fixture.gw} 
                                    gw={fixture.gw} 
                                    isHome={fixture.is_home} 
                                    opponentShort={fixture.opp_short} 
                                    opponentLong={fixture.opp_long} 
                                />
                            )}
                        </div>
                    </div>
                )}

                {details.history.length > 0 && (
                    <div className="bg-white rounded-xl shadow-md border border-gray-200">
                        <h3 className="text-xl font-bold text-black p-4">This Season</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[600px]">
                                <thead className="border-b-2 border-gray-200">
                                    <tr className="text-xs text-gray-500 uppercase text-center">
                                        <th className="p-2 font-semibold">GW</th>
                                        <th className="p-2 font-semibold text-left">OPP</th>
                                        <th className="p-2 font-semibold">PTS</th>
                                        <th className="p-2 font-semibold">MP</th>
                                        <th className="p-2 font-semibold">GS</th>
                                        <th className="p-2 font-semibold">A</th>
                                        <th className="p-2 font-semibold">CS</th>
                                        <th className="p-2 font-semibold">GC</th>
                                        <th className="p-2 font-semibold">YC</th>
                                        <th className="p-2 font-semibold">RC</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {details.history.map((row: any) => <HistoryRow key={row.gw} {...row} />)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
              </>
            ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
};