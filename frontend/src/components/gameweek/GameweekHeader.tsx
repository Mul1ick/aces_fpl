// FILE: frontend/src/components/gameweek/GameweekHeader.tsx
import React from 'react';
import { cn } from '@/lib/utils';
import { Star, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GameweekHeaderProps {
  gw: string | undefined;
  view: string;
  setView: (view: string) => void;
  teamName?: string;
  managerName?: string;
  totalPoints?: number;
  averagePoints?: number;
  highestPoints?: number;
  gwRank?: string | number;
  transfersCount?: number | string;
  onNavigate: (direction: 'prev' | 'next') => void;
  currentGameweekNumber?: number | null;
  activeChip?: 'WILDCARD' | 'FREE_HIT' | 'TRIPLE_CAPTAIN' | 'BENCH_BOOST' | string | null;
  hideTeamOfTheWeekLink?: boolean; // <--- ADDED PROP
}

const formatChipName = (chip?: string | null) => {
  if (!chip) return '';
  if (chip === 'TRIPLE_CAPTAIN') return 'Triple Captain';
  if (chip === 'BENCH_BOOST') return 'Bench Boost';
  if (chip === 'FREE_HIT') return 'Free Hit';
  if (chip === 'WILDCARD') return 'Wildcard';
  return chip.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

export const GameweekHeader: React.FC<GameweekHeaderProps> = ({ 
    gw, 
    view, 
    setView,
    teamName,
    totalPoints,
    averagePoints,
    highestPoints,
    gwRank,
    transfersCount,
    onNavigate,
    currentGameweekNumber,
    activeChip,
    hideTeamOfTheWeekLink // <--- DESTRUCTURED PROP
}) => {
  const currentGw = parseInt(gw || '1', 10);
  const navigate = useNavigate();

  return (
    <header className="px-4 py-3 md:px-6 md:py-3 text-white w-full">
      
      {/* ========================================= */}
      {/* MOBILE LAYOUT                             */}
      {/* ========================================= */}
      <div className="flex md:hidden flex-col w-full gap-3">
        
        {/* Row 1: Team Name */}
        <h1 className="text-[24px] font-bold truncate leading-none mt-1">
          {teamName || 'Your Team'}
        </h1>

        {/* Row 2: Gameweek Nav */}
        <div className="flex justify-center items-center gap-4">
          {currentGw > 1 ? (
            <button 
              className="bg-[#2a0832] hover:bg-[#3d0c4a] transition-colors rounded-full w-7 h-7 flex items-center justify-center shadow-sm" 
              onClick={() => onNavigate('prev')}
            >
              <ChevronLeft className="w-3.5 h-3.5 text-white" />
            </button>
          ) : (
            <div className="w-7 h-7" /> 
          )}

          <h2 className="text-xl font-bold tracking-tight whitespace-nowrap">
            Gameweek {gw || 1}
          </h2>
          
          {(currentGameweekNumber && currentGw < currentGameweekNumber) ? (
            <button 
              className="bg-[#2a0832] hover:bg-[#3d0c4a] transition-colors rounded-full w-7 h-7 flex items-center justify-center shadow-sm" 
              onClick={() => onNavigate('next')}
            >
              <ChevronRight className="w-3.5 h-3.5 text-white" />
            </button>
          ) : (
            <div className="w-7 h-7" /> 
          )}
        </div>

        {/* Row 3: Main Stats */}
        <div className="flex justify-between items-center w-full px-1">
          
          <div className="flex flex-col w-[28%] items-center gap-2">
            <div className="text-center">
              <div className="text-xl font-bold mb-0.5">{averagePoints ?? '-'}</div>
              <div className="text-[10px] text-gray-300">Average Points</div>
            </div>
            <div className="w-full h-px bg-white/10" />
            <div 
              className="text-center cursor-pointer group"
              onClick={() => navigate(`/team-of-the-week/${gw}`)}
            >
              <div className="text-xl font-bold mb-0.5">{highestPoints ?? '-'}</div>
              <div className="text-[10px] text-gray-300 flex items-center justify-center">
                Highest Points <ArrowRight className="w-3 h-3 ml-1" />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center w-[40%]">
            <div className="flex flex-col shadow-[0_8px_20px_rgba(0,0,0,0.3)] rounded-xl w-full max-w-[110px]">
              <div className={cn(
                "bg-gradient-to-br from-[#00FFFF] to-[#5b6cf7] flex flex-col items-center justify-center py-3",
                activeChip ? "rounded-t-xl" : "rounded-xl"
              )}>
                <span className="text-[#2a002d] text-[42px] font-black leading-none mb-1 tracking-tight">
                  {totalPoints ?? '0'}
                </span>
                <span className="text-[#2a002d]/80 text-[10px] font-semibold tracking-wide">Total Points</span>
              </div>
              {activeChip && (
                <div className="bg-white text-[#2a002d] font-bold text-[10px] py-1 w-full text-center tracking-wide rounded-b-xl border-t border-white/10">
                  {formatChipName(activeChip)}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col w-[28%] items-center gap-2">
            <div className="text-center">
              <div className="text-xl font-bold mb-0.5 truncate w-full">{gwRank ?? '-'}</div>
              <div className="text-[10px] text-gray-300">GW Rank</div>
            </div>
            <div className="w-full h-px bg-white/10" />
            <div 
              className="text-center cursor-pointer group"
              onClick={() => navigate('/transfers')}
            >
              <div className="text-xl font-bold mb-0.5">{transfersCount ?? '0'}</div>
              <div className="text-[10px] text-gray-300 flex items-center justify-center">
                Transfers <ArrowRight className="w-3 h-3 ml-1" />
              </div>
            </div>
          </div>
        </div>

        {/* Row 4: Team of the Week Link (CONDITIONALLY RENDERED) */}
        {!hideTeamOfTheWeekLink && (
          <div 
            className="flex items-center justify-center text-[12px] font-bold cursor-pointer hover:text-gray-200 transition-colors"
            onClick={() => navigate(`/team-of-the-week/${gw}`)}
          >
            <Star className="w-3.5 h-3.5 text-[#00FFCC] mr-1.5 fill-[#00FFCC]" />
            Team of the Week <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        )}

        {/* Row 5: View Toggles */}
        <div className="flex bg-[#2a0832] p-1 rounded-lg w-full shadow-inner">
          <button 
            onClick={() => setView('pitch')} 
            className={cn(
              "flex-1 py-2 text-xs font-semibold rounded-md transition-all", 
              view === 'pitch' ? 'bg-[#1a0020] shadow-md text-white' : 'text-white/70'
            )}
          >
            Pitch View
          </button>
          <button 
            onClick={() => setView('list')} 
            className={cn(
              "flex-1 py-2 text-xs font-semibold rounded-md transition-all", 
              view === 'list' ? 'bg-[#1a0020] shadow-md text-white' : 'text-white/70'
            )}
          >
            List View
          </button>
        </div>

      </div>


      {/* ========================================= */}
      {/* DESKTOP LAYOUT                            */}
      {/* ========================================= */}
      <div className="hidden md:flex flex-col w-full gap-2">
        
        {/* Top Row: Name & Toggles */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold truncate pr-4">
            {teamName || 'Your Team'}
          </h1>
          
          <div className="flex bg-black/20 p-0.5 rounded-lg w-fit border border-white/10 shadow-inner shrink-0">
            <button 
              onClick={() => setView('pitch')} 
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-md transition-all", 
                view === 'pitch' ? 'bg-[#1a0020] shadow-md text-white' : 'text-white/70 hover:text-white'
              )}
            >
              Pitch View
            </button>
            <button 
              onClick={() => setView('list')} 
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-md transition-all", 
                view === 'list' ? 'bg-[#1a0020] shadow-md text-white' : 'text-white/70 hover:text-white'
              )}
            >
              List View
            </button>
          </div>
        </div>

        {/* Gameweek Nav */}
        <div className="flex justify-center items-center gap-4">
          {currentGw > 1 ? (
            <button 
              className="bg-black/20 hover:bg-black/40 transition-colors rounded-full w-7 h-7 flex items-center justify-center shadow-sm" 
              onClick={() => onNavigate('prev')}
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
          ) : (
            <div className="w-7 h-7" /> 
          )}

          <h2 className="text-lg font-bold tracking-tight whitespace-nowrap">
            Gameweek {gw || 1}
          </h2>
          
          {(currentGameweekNumber && currentGw < currentGameweekNumber) ? (
            <button 
              className="bg-black/20 hover:bg-black/40 transition-colors rounded-full w-7 h-7 flex items-center justify-center shadow-sm" 
              onClick={() => onNavigate('next')}
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          ) : (
            <div className="w-7 h-7" /> 
          )}
        </div>

        {/* Main Stats Row */}
        <div className="flex justify-center items-center gap-8 lg:gap-12 w-full mt-1">
          
          {/* Left Column Stats */}
          <div className="flex items-center gap-8 lg:gap-12">
            <div className="flex flex-col items-center text-center">
              <span className="text-2xl font-bold mb-0.5">{averagePoints ?? '...'}</span>
              <span className="text-[10px] text-gray-300">Average Points</span>
            </div>
            
            <div 
              className="flex flex-col items-center text-center cursor-pointer group"
              onClick={() => navigate(`/team-of-the-week/${gw}`)}
            >
              <span className="text-2xl font-bold mb-0.5">{highestPoints ?? '...'}</span>
              <span className="text-[10px] text-gray-300 flex items-center justify-center">
                Highest Points <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </div>

          {/* Center Points Box */}
          <div className="flex flex-col items-center justify-center mx-2">
            <div className="flex flex-col shadow-[0_8px_20px_rgba(0,0,0,0.3)] rounded-[14px] w-28">
              <div className={cn(
                "bg-gradient-to-br from-[#00FFFF] to-[#5b6cf7] flex flex-col items-center justify-center py-3",
                activeChip ? "rounded-t-[14px]" : "rounded-[14px]"
              )}>
                <span className="text-[#2a002d] text-4xl font-black leading-none mb-1 tracking-tight">
                  {totalPoints ?? '0'}
                </span>
                <span className="text-[#2a002d]/80 text-[10px] font-semibold tracking-wide">Total Points</span>
              </div>
              {activeChip && (
                <div className="bg-white text-[#2a002d] font-bold text-[10px] py-1 w-full text-center tracking-wide rounded-b-[14px] border-t border-white/10">
                  {formatChipName(activeChip)}
                </div>
              )}
            </div>

            {/* TOTW Link (CONDITIONALLY RENDERED) */}
            {!hideTeamOfTheWeekLink && (
              <div 
                className="mt-2 flex items-center text-[11px] font-bold cursor-pointer group hover:text-gray-200 transition-colors"
                onClick={() => navigate(`/team-of-the-week/${gw}`)}
              >
                <Star className="w-3 h-3 text-[#00FFCC] mr-1.5 fill-[#00FFCC]" />
                Team of the Week <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            )}
          </div>

          {/* Right Column Stats */}
          <div className="flex items-center gap-8 lg:gap-12">
            <div className="flex flex-col items-center text-center">
              <span className="text-2xl font-bold mb-0.5">{gwRank ?? '...'}</span>
              <span className="text-[10px] text-gray-300">GW Rank</span>
            </div>
            
            <div 
              className="flex flex-col items-center text-center cursor-pointer group"
              onClick={() => navigate('/transfers')}
            >
              <span className="text-2xl font-bold mb-0.5">{transfersCount ?? '0'}</span>
              <span className="text-[10px] text-gray-300 flex items-center justify-center">
                Transfers <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </div>

        </div>
      </div>
      
    </header>
  );
};

export default GameweekHeader;