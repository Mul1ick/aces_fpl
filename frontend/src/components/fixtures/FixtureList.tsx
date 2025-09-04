import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FixtureRow } from './FixtureRow';

// We'll define the types again here. They will be consolidated
// in the main Fixtures.tsx page when we create it.
interface Team {
  name: string;
  shortName: string;
}

interface Match {
  date: string;
  homeTeam: Team;
  awayTeam: Team;
  time?: string;
  homeScore?: number;
  awayScore?: number;
}


interface FixtureListProps {
  matches: Match[];
}

export const FixtureList: React.FC<FixtureListProps> = ({ matches }) => {
  // useMemo efficiently groups matches by date, only re-calculating when the 'matches' prop changes.
  const groupedMatches = useMemo(() => {
    return matches.reduce((acc, match) => {
      (acc[match.date] = acc[match.date] || []).push(match);
      return acc;
    }, {} as Record<string, Match[]>);
  }, [matches]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      key={JSON.stringify(matches)} // This key re-triggers animations when the gameweek changes
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {Object.entries(groupedMatches).map(([date, dayMatches]) => (
        <motion.div key={date} variants={itemVariants}>
          <h3 className="font-bold text-text mb-2 px-4">{date}</h3>
          <div className="space-y-1">
            {dayMatches.map((match, index) => (
              <FixtureRow key={`${match.homeTeam.name}-${index}`} match={match} />
            ))}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

