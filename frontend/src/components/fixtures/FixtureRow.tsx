import React from 'react';

// Define the structure of the props the component expects.
// This should match the structure in Fixtures.tsx
interface Team {
  name: string;
  logo: string;
}

interface Match {
  homeTeam: Team;
  awayTeam: Team;
  time?: string;
  homeScore?: number;
  awayScore?: number;
}

interface FixtureRowProps {
  match: Match;
}

export const FixtureRow: React.FC<FixtureRowProps> = ({ match }) => {
  const { homeTeam, awayTeam, time, homeScore, awayScore } = match;

  // Check if the match has a score to display
  const hasScore = typeof homeScore === 'number' && typeof awayScore === 'number';

  return (
    // Use a 5-column grid for precise alignment.
    // [Home Name] [Home Logo] [Time/Score] [Away Logo] [Away Name]
    <div className="grid grid-cols-[1fr_auto_auto_auto_1fr] items-center gap-x-3 py-3">
      {/* Home Team Name */}
      <span className="font-semibold text-text text-right hidden sm:block truncate">{homeTeam.name}</span>
      
      {/* Home Team Logo */}
      <img src={homeTeam.logo} alt={`${homeTeam.name} logo`} className="w-6 h-6 object-contain justify-self-end" />

      {/* Time or Score in the middle */}
      <div className="text-center">
        {hasScore ? (
          <span className="text-sm font-bold bg-gray-200 text-text px-2 py-1 rounded-md tabular-nums">
            {homeScore} - {awayScore}
          </span>
        ) : (
          <span className="text-sm font-semibold text-text-muted tabular-nums">{time}</span>
        )}
      </div>

      {/* Away Team Logo */}
      <img src={awayTeam.logo} alt={`${awayTeam.name} logo`} className="w-6 h-6 object-contain justify-self-start" />
      
      {/* Away Team Name */}
      <span className="font-semibold text-text text-left hidden sm:block truncate">{awayTeam.name}</span>
    </div>
  );
};

