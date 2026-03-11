// FILE: frontend/src/components/fixtures/FixtureRow.tsx
import React from 'react';

interface Team {
  name: string;
  shortName: string;
  logo: string;
}

interface Match {
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
  const { homeTeam, awayTeam, time, homeScore, awayScore } = match;

  // Check if the match has a score to display
  const hasScore = typeof homeScore === 'number' && typeof awayScore === 'number';

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors px-1 sm:px-4 rounded-lg">
      
      {/* Home Team */}
      <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3 min-w-0">
        <span className="font-bold text-text text-xs sm:text-base text-right truncate">
          {/* Show short name on mobile, full name on larger screens */}
          <span className="sm:hidden">{homeTeam.shortName}</span>
          <span className="hidden sm:inline">{homeTeam.name}</span>
        </span>
        <img 
          src={homeTeam.logo} 
          alt={`${homeTeam.name} logo`} 
          className="w-8 h-8 sm:w-10 sm:h-10 object-contain shrink-0" 
        />
      </div>

      {/* Time or Score in the middle */}
      <div className="w-16 sm:w-24 text-center shrink-0 mx-1 sm:mx-2">
        {hasScore ? (
          <span className="text-xs sm:text-sm font-bold bg-black text-white px-2 py-1 rounded tabular-nums">
            {homeScore} - {awayScore}
          </span>
        ) : (
          <span className="text-xs sm:text-sm font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded tabular-nums">
            {time}
          </span>
        )}
      </div>

      {/* Away Team */}
      <div className="flex flex-1 items-center justify-start gap-2 sm:gap-3 min-w-0">
        <img 
          src={awayTeam.logo} 
          alt={`${awayTeam.name} logo`} 
          className="w-8 h-8 sm:w-10 sm:h-10 object-contain shrink-0" 
        />
        <span className="font-bold text-text text-xs sm:text-base text-left truncate">
          {/* Show short name on mobile, full name on larger screens */}
          <span className="sm:hidden">{awayTeam.shortName}</span>
          <span className="hidden sm:inline">{awayTeam.name}</span>
        </span>
      </div>

    </div>
  );
};