import React, { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

// --- MOCK DATA & ASSETS ---
import redLogo from '@/assets/images/team-logos/red.png';
import blueLogo from '@/assets/images/team-logos/blue.png';
import blackLogo from '@/assets/images/team-logos/black.png';
import whiteLogo from '@/assets/images/team-logos/white.png';

const teamLogos = {
    'Arsenal': redLogo,
    'Man City': blueLogo,
    'Liverpool': redLogo,
    'Spurs': whiteLogo,
    'Chelsea': blueLogo,
    'Newcastle': blackLogo,
};

const shortTeamLogos = {
    'ARS': redLogo, 'CHE': blueLogo, 'LIV': redLogo,
    'MCI': blueLogo, 'MUN': redLogo, 'NEW': blackLogo,
    'BOU': redLogo, 'WHU': redLogo, 'BHA': blueLogo,
    'EVE': blueLogo, 'CRY': blueLogo, 'LEE': whiteLogo
};

// --- SUB-COMPONENTS for the Modal ---

const StatBox = ({ label, value }) => (
    <div className="text-center bg-gray-100 p-2 rounded-lg">
        <p className="text-lg font-bold text-black">{value}</p>
        <p className="text-xs text-gray-600">{label}</p>
    </div>
);

const FixtureBox = ({ opponent, isHome, gw }) => (
    <div className="text-center space-y-1 flex flex-col items-center">
        <p className="text-xs font-bold text-gray-700">{opponent} {isHome ? '(H)' : '(A)'}</p>
        <div className='w-10 h-10 flex items-center justify-center p-1'>
            <img src={shortTeamLogos[opponent] || whiteLogo} alt={opponent} className="w-full h-full object-contain" />
        </div>
        <p className="text-xs text-gray-500">GW{gw}</p>
    </div>
);


const HistoryRow = ({ gw, opp, result, pts, ...stats }) => {
    const opponentShortName = opp.substring(0, 3);
    return (
        <tr className="border-b border-gray-200 last:border-b-0 text-center text-sm text-gray-800">
            <td className="p-2 font-bold">{gw}</td>
            <td className="p-2 text-left">
                <div className="flex items-center gap-x-2">
                    <img src={shortTeamLogos[opponentShortName] || whiteLogo} alt={opponentShortName} className="w-5 h-5" />
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
};

// --- MAIN COMPONENT ---
interface PlayerDetailModalProps {
  player: any;
  isOpen: boolean;
  onClose: () => void;
}

export const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({ player, isOpen, onClose }) => {
  if (!player) return null;
  
  const mockHistory = [
      { gw: 3, opp: 'LIV (A)', result: 'L', pts: 2, mp: 90, gs: 0, a: 0, cs: 0, gc: 1, yc: 1, rc: 0 },
      { gw: 2, opp: 'LEE (H)', result: 'W', pts: 13, mp: 63, gs: 0, a: 2, cs: 1, gc: 0, yc: 0, rc: 0 },
      { gw: 1, opp: 'MUN (A)', result: 'W', pts: 13, mp: 71, gs: 1, a: 0, cs: 1, gc: 0, yc: 0, rc: 0 },
  ];

  const mockFixtures = [
      { gw: 6, opponent: 'BOU', isHome: true, difficulty: 2 },
      { gw: 7, opponent: 'WHU', isHome: false, difficulty: 4 },
      { gw: 8, opponent: 'BHA', isHome: false, difficulty: 3 },
      { gw: 9, opponent: 'EVE', isHome: true, difficulty: 2 },
      { gw: 10, opponent: 'CRY', isHome: false, difficulty: 3 },
  ];

  const totals = mockHistory.reduce((acc, row) => {
      acc.pts += row.pts;
      acc.mp += row.mp;
      acc.gs += row.gs;
      acc.a += row.a;
      acc.cs += row.cs;
      acc.gc += row.gc;
      acc.yc += row.yc;
      acc.rc += row.rc;
      return acc;
  }, { pts: 0, mp: 0, gs: 0, a: 0, cs: 0, gc: 0, yc: 0, rc: 0 });

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        hideCloseButton // <-- Added the prop here to hide the default button
        className="bg-white text-black w-full md:w-1/2 p-0 flex flex-col overflow-hidden md:max-w-none"
      >
        {/* Header */}
        <div className="flex-shrink-0 p-6 bg-dashboard-gradient text-white relative">
            <div className="flex items-center space-x-4">
                <div className="w-24 h-24 flex items-center justify-center">
                    <img 
                        src={teamLogos[player.team] || whiteLogo} 
                        alt={`${player.team} logo`} 
                        className="w-20 h-20 object-contain" 
                    />
                </div>
                <div>
                    <p className="font-semibold text-white/80">{player.pos}</p>
                    <h2 className="text-3xl font-extrabold text-white">{player.name}</h2>
                    <p className="font-bold text-white/90">{player.team}</p>
                </div>
            </div>
            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/10 rounded-full p-1 transition-colors"
            >
                <X className="h-6 w-6" />
                <span className="sr-only">Close</span>
            </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-gray-50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatBox label="Price" value={`£${player.price.toFixed(1)}m`} />
                <StatBox label="Pts / Match" value="5.8" />
                <StatBox label="GW Points" value="2" />
                <StatBox label="Total Pts" value={player.points} />
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
                <h3 className="text-xl font-bold text-black mb-4">Upcoming Fixtures</h3>
                <div className="grid grid-cols-5 gap-2">
                    {mockFixtures.map(fixture => (
                        <FixtureBox key={fixture.gw} {...fixture} />
                    ))}
                </div>
            </div>

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
                            {mockHistory.map(row => <HistoryRow key={row.gw} {...row} />)}
                        </tbody>
                        <tfoot className="bg-gray-100 font-semibold">
                            <tr className="text-center text-sm text-gray-800">
                                <td colSpan={2} className="p-2 text-left">Totals</td>
                                <td className="p-2 font-bold text-black">{totals.pts}</td>
                                <td className="p-2">{totals.mp}</td>
                                <td className="p-2">{totals.gs}</td>
                                <td className="p-2">{totals.a}</td>
                                <td className="p-2">{totals.cs}</td>
                                <td className="p-2">{totals.gc}</td>
                                <td className="p-2">{totals.yc}</td>
                                <td className="p-2">{totals.rc}</td>
                            </tr>
                            <tr className="text-center text-sm text-gray-800 border-t border-gray-200">
                                <td colSpan={2} className="p-2 text-left">Per 90</td>
                                <td className="p-2">-</td>
                                <td className="p-2">-</td>
                                <td className="p-2">-</td>
                                <td className="p-2">-</td>
                                <td className="p-2">-</td>
                                <td className="p-2">-</td>
                                <td className="p-2">-</td>
                                <td className="p-2">-</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};