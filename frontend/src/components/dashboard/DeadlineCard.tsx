import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { getTeamLogo } from '@/lib/player-utils';

interface Fixture {
  id: number;
  kickoff: string;
  home: { name: string; short_name: string };
  away: { name: string; short_name: string };
}

interface DeadlineCardProps {
  gameweek: {
    gw_number: number;
    deadline: string;
  } | null;
  fixtures: Fixture[];
}

export const DeadlineCard: React.FC<DeadlineCardProps> = ({ gameweek, fixtures }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!gameweek?.deadline) return;

    const calculateTimeLeft = () => {
      const difference = +new Date(gameweek.deadline) - +new Date();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [gameweek]);

  // Helper to Pad Numbers
  const pad = (num: number) => String(num).padStart(2, '0');

  // --- SAFEGUARD: Render empty state if no gameweek found ---
  if (!gameweek) {
    return (
      <Card className="bg-white text-black border-2 border-black shadow-sm rounded-xl overflow-hidden font-sans w-full h-full flex items-center justify-center min-h-[300px]">
        <CardContent className="text-center p-6">
          <h2 className="text-xl font-bold mb-2">No Active Deadline</h2>
          <p className="text-gray-500 text-sm">The season may be finished or between phases.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white text-black border-2 border-black shadow-sm rounded-xl overflow-hidden font-sans w-full">
      <CardContent className="p-4 sm:p-6">
        
        {/* --- SECTION 1: COUNTDOWN --- */}
        <div className="mb-2">
          <h2 className="text-xl font-bold mb-1 tracking-tight text-black">Next Deadline</h2>
          <p className="text-sm font-semibold text-gray-500 mb-6">Gameweek {gameweek.gw_number}</p>
          
          <div className="flex items-start justify-between w-full max-w-md mx-auto xl:mx-0">
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tabular-nums leading-none tracking-tight text-black">{pad(timeLeft.days)}</span>
              <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">Days</span>
            </div>
            <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-300 -mt-1">:</span>
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tabular-nums leading-none tracking-tight text-black">{pad(timeLeft.hours)}</span>
              <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">Hours</span>
            </div>
            <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-300 -mt-1">:</span>
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tabular-nums leading-none tracking-tight text-black">{pad(timeLeft.minutes)}</span>
              <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">Mins</span>
            </div>
            <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-300 -mt-1">:</span>
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tabular-nums leading-none tracking-tight text-[#E90052]">{pad(timeLeft.seconds)}</span>
              <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">Secs</span>
            </div>
          </div>
        </div>

        {/* --- SECTION 2: UPCOMING FIXTURES LIST --- */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h3 className="text-lg font-bold mb-4 tracking-tight text-black">Upcoming Fixtures</h3>
          
          <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 pb-2 border-b border-gray-100">
            <span>Fixture</span>
            <span>Kickoff</span>
          </div>

          <div className="space-y-0">
            {fixtures.slice(0, 5).map((fixture) => (
              <div 
                key={fixture.id} 
                className="flex justify-between items-center py-3 border-b border-gray-100 last:border-none hover:bg-gray-50 transition-colors px-1"
              >
                {/* Matchup Column */}
                <div className="flex items-center gap-2 flex-1 min-w-0 mr-4">
                  {/* Home Team (Right Aligned Text) */}
                  <div className="flex items-center gap-2 justify-end flex-1">
                    <span className="font-bold text-sm text-black text-right leading-tight break-words">{fixture.home.name}</span>
                    <img 
                      src={getTeamLogo(fixture.home.short_name)} 
                      alt={fixture.home.short_name} 
                      className="w-6 h-6 object-contain flex-shrink-0" 
                    />
                  </div>
                  
                  <span className="text-xs text-gray-300 font-bold flex-shrink-0">v</span>

                  {/* Away Team (Left Aligned Text) */}
                  <div className="flex items-center gap-2 flex-1">
                    <img 
                      src={getTeamLogo(fixture.away.short_name)} 
                      alt={fixture.away.short_name} 
                      className="w-6 h-6 object-contain flex-shrink-0" 
                    />
                    <span className="font-bold text-sm text-black text-left leading-tight break-words">{fixture.away.name}</span>
                  </div>
                </div>

                {/* Kickoff Time */}
                <div className="text-sm font-medium text-black tabular-nums whitespace-nowrap flex-shrink-0">
                  {format(new Date(fixture.kickoff), 'E d MMM, HH:mm')}
                </div>
              </div>
            ))}
            
            {fixtures.length === 0 && (
              <div className="py-6 text-center text-gray-400 text-sm italic">
                No upcoming fixtures available.
              </div>
            )}
          </div>
        </div>

      </CardContent>
    </Card>
  );
};