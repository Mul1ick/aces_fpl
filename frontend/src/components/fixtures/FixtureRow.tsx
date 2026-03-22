import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Loader2 } from 'lucide-react';
import { API } from '@/lib/api';

interface Team {
  name: string;
  shortName: string;
  logo: string;
}

interface Match {
  id: number;
  homeTeam: Team;
  awayTeam: Team;
  time?: string;
  homeScore?: number | null;
  awayScore?: number | null;
}

interface FixtureRowProps {
  match: Match;
}

export const FixtureRow: React.FC<FixtureRowProps> = ({ match }) => {
  const { homeTeam, awayTeam, time, homeScore, awayScore, id } = match;
  
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [details, setDetails] = useState<any>(null);

  const hasScore = typeof homeScore === 'number' && typeof awayScore === 'number';

  const toggleExpand = async () => {
    setIsOpen(!isOpen);

    // Fetch data only if opening and data isn't already loaded
    if (!isOpen && !details) {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('access_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        const res = await fetch(API.endpoints.fixtureDetails(id), { headers });
        if (res.ok) {
          const data = await res.json();
          setDetails(data);
        }
      } catch (error) {
        console.error("Failed to load fixture details", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden bg-white mb-2 shadow-sm transition-all hover:shadow-md">
      
      {/* --- MAIN ROW (CLICKABLE) --- */}
      <div 
        className="flex items-center justify-between py-3 px-2 sm:px-4 cursor-pointer hover:bg-gray-50 transition-colors relative z-10 bg-white"
        onClick={toggleExpand}
      >
        {/* Home Team */}
        <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3 min-w-0">
          <span className="font-bold text-gray-900 text-xs sm:text-base text-right truncate">
            <span className="sm:hidden">{homeTeam.shortName}</span>
            <span className="hidden sm:inline">{homeTeam.name}</span>
          </span>
          <img src={homeTeam.logo} alt="home logo" className="w-6 h-6 sm:w-10 sm:h-10 object-contain shrink-0" />
        </div>

        {/* Time or Score in the middle */}
        <div className="w-16 sm:w-24 flex flex-col items-center justify-center shrink-0 mx-1 sm:mx-3">
          {hasScore ? (
            <span className="text-xs sm:text-sm font-bold bg-black text-white px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg tabular-nums shadow-sm whitespace-nowrap">
              {homeScore} - {awayScore}
            </span>
          ) : (
            <span className="text-xs sm:text-sm font-semibold text-gray-600 bg-gray-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg tabular-nums border border-gray-200 whitespace-nowrap">
              {time}
            </span>
          )}
        </div>

        {/* Away Team */}
        <div className="flex flex-1 items-center justify-start gap-2 sm:gap-3 min-w-0">
          <img src={awayTeam.logo} alt="away logo" className="w-6 h-6 sm:w-10 sm:h-10 object-contain shrink-0" />
          <span className="font-bold text-gray-900 text-xs sm:text-base text-left truncate">
            <span className="sm:hidden">{awayTeam.shortName}</span>
            <span className="hidden sm:inline">{awayTeam.name}</span>
          </span>
        </div>

        {/* Expand Icon */}
        <div className="pl-1 sm:pl-2 flex items-center shrink-0">
           <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-black' : ''}`} />
        </div>
      </div>

      {/* --- EXPANDABLE DETAILS AREA --- */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-gray-50/50 border-t border-gray-100"
          >
            {isLoading ? (
              <div className="py-8 flex justify-center items-center gap-2 text-gray-500 text-xs sm:text-sm font-medium">
                <Loader2 className="w-4 h-4 animate-spin text-gray-500" /> Loading match events...
              </div>
            ) : details?.stats?.length > 0 ? (
              <div className="p-2 sm:p-4 md:p-5">
                {/* Unified container for all stats */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  
                  {details.stats.map((stat: any, index: number) => (
                    <div key={stat.category} className="border-b border-gray-100 last:border-0">
                      
                      {/* Category Header */}
                      <div className="bg-gray-50/80 text-gray-500 text-[10px] sm:text-xs uppercase tracking-[0.15em] font-bold text-center py-2 sm:py-2.5 border-b border-gray-100">
                        {stat.category}
                      </div>

                      {/* Strict 50/50 Split Grid */}
                      <div className="grid grid-cols-2 text-xs sm:text-sm">
                        
                        {/* Left: Home Team Players */}
                        <div className="pr-2 pl-2 sm:pr-6 sm:pl-4 py-2 sm:py-3 border-r border-gray-100 space-y-1 sm:space-y-1.5 min-w-0">
                          {stat.home.map((p: any, i: number) => (
                            <div key={i} className="flex justify-end items-center gap-1 sm:gap-1.5 w-full min-w-0">
                              <span className="text-gray-800 font-semibold tracking-tight truncate">{p.name}</span>
                              <span className="text-gray-400 font-medium text-[10px] sm:text-xs shrink-0">({p.value})</span>
                            </div>
                          ))}
                        </div>

                        {/* Right: Away Team Players */}
                        <div className="pl-2 pr-2 sm:pl-6 sm:pr-4 py-2 sm:py-3 space-y-1 sm:space-y-1.5 min-w-0">
                          {stat.away.map((p: any, i: number) => (
                            <div key={i} className="flex justify-start items-center gap-1 sm:gap-1.5 w-full min-w-0">
                              <span className="text-gray-800 font-semibold tracking-tight truncate">{p.name}</span>
                              <span className="text-gray-400 font-medium text-[10px] sm:text-xs shrink-0">({p.value})</span>
                            </div>
                          ))}
                        </div>

                      </div>
                    </div>
                  ))}
                  
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs sm:text-sm font-medium text-gray-500">
                {hasScore ? "No major statistical events recorded." : "Match events will appear here after kickoff."}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};