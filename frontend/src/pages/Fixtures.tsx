import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FixtureList } from '@/components/fixtures/FixtureList';
import { GameweekNavigator } from '@/components/fixtures/GameweekNavigator';

// --- LOGO IMPORTS ---
// We'll import all the logo images you've created.
// Make sure you have created the folder: frontend/src/assets/images/team-logos/
// and added the logo files there.
import redLogo from '@/assets/images/team-logos/red.png';
import blueLogo from '@/assets/images/team-logos/blue.png';
import blackLogo from '@/assets/images/team-logos/black.png';
import whiteLogo from '@/assets/images/team-logos/white.png';
import greyLogo from '@/assets/images/team-logos/grey.png';
import yellowLogo from '@/assets/images/team-logos/yellow.png';


// --- LOGO MAPPING ---
// This map connects a team's short name to its logo file.
const LOGO_MAP: { [key: string]: string } = {
    "ARS": redLogo,
    "NFO": redLogo,
    "BOU": redLogo,
    "CRY": blueLogo,
    "BRE": redLogo,
    "MUN": redLogo,
    "MCI": blueLogo,
    "CHE": blueLogo,
    "LIV": redLogo,
    "TOT": whiteLogo,
    "EVE": blueLogo,
    "WOL": yellowLogo,
    "SOU": redLogo,
    "BHA": blueLogo,
    "SUN": redLogo,
};

// --- TYPE DEFINITIONS ---
// Updated to include the logo property.
interface Team {
  name: string;
  shortName: string;
  logo: string; // Added logo property
}

interface Match {
  date: string;
  homeTeam: Team;
  awayTeam: Team;
  time?: string;
  homeScore?: number;
  awayScore?: number;
}

interface GameweekData {
  gameweek: number;
  title: string;
  deadline: string;
  matches: Match[];
}


// --- MOCK DATA ---
// The data now includes the logo for each team.
const FPL_FIXTURES: GameweekData[] = [
    {
      gameweek: 4,
      title: "Gameweek 4",
      deadline: "Sat 13 Sep, 15:30",
      matches: [
        { date: "Sat 13 Sep", homeTeam: { name: "Arsenal", shortName: "ARS", logo: LOGO_MAP["ARS"] }, awayTeam: { name: "Nott'm Forest", shortName: "NFO", logo: LOGO_MAP["NFO"] }, time: "17:00" },
        { date: "Sat 13 Sep", homeTeam: { name: "Bournemouth", shortName: "BOU", logo: LOGO_MAP["BOU"] }, awayTeam: { name: "Brighton", shortName: "BHA", logo: LOGO_MAP["BHA"] }, time: "19:30" },
        { date: "Sat 13 Sep", homeTeam: { name: "Crystal Palace", shortName: "CRY", logo: LOGO_MAP["CRY"] }, awayTeam: { name: "Sunderland", shortName: "SUN", logo: LOGO_MAP["SUN"] }, time: "19:30" },
        { date: "Sun 14 Sep", homeTeam: { name: "Brentford", shortName: "BRE", logo: LOGO_MAP["BRE"] }, awayTeam: { name: "Chelsea", shortName: "CHE", logo: LOGO_MAP["CHE"] }, time: "00:50" },
        { date: "Sun 14 Sep", homeTeam: { name: "Man City", shortName: "MCI", logo: LOGO_MAP["MCI"] }, awayTeam: { name: "Man Utd", shortName: "MUN", logo: LOGO_MAP["MUN"] }, time: "21:00" },
      ]
    },
    {
        gameweek: 5,
        title: "Gameweek 5",
        deadline: "Sat 20 Sep, 15:30",
        matches: [
          { date: "Sat 20 Sep", homeTeam: { name: "Man Utd", shortName: "MUN", logo: LOGO_MAP["MUN"] }, awayTeam: { name: "Liverpool", shortName: "LIV", logo: LOGO_MAP["LIV"] }, time: "17:00" },
          { date: "Sat 20 Sep", homeTeam: { name: "Chelsea", shortName: "CHE", logo: LOGO_MAP["CHE"] }, awayTeam: { name: "Arsenal", shortName: "ARS", logo: LOGO_MAP["ARS"] }, time: "19:30" },
          { date: "Sun 21 Sep", homeTeam: { name: "Tottenham", shortName: "TOT", logo: LOGO_MAP["TOT"] }, awayTeam: { name: "Man City", shortName: "MCI", logo: LOGO_MAP["MCI"] }, time: "21:00" },
        ]
    },
    {
        gameweek: 3,
        title: "Gameweek 3",
        deadline: "Sat 6 Sep, 15:30",
        matches: [
          { date: "Sat 6 Sep", homeTeam: { name: "Liverpool", shortName: "LIV", logo: LOGO_MAP["LIV"] }, awayTeam: { name: "Everton", shortName: "EVE", logo: LOGO_MAP["EVE"] }, homeScore: 2, awayScore: 0 },
          { date: "Sat 6 Sep", homeTeam: { name: "Wolves", shortName: "WOL", logo: LOGO_MAP["WOL"] }, awayTeam: { name: "Southampton", shortName: "SOU", logo: LOGO_MAP["SOU"] }, homeScore: 1, awayScore: 0 },
        ]
      },
  ].sort((a, b) => a.gameweek - b.gameweek); // Ensure gameweeks are sorted


const Fixtures: React.FC = () => {
  // State to track the currently viewed gameweek index
  const [currentGwIndex, setCurrentGwIndex] = useState(0);

  const handlePrevious = () => {
    setCurrentGwIndex((prevIndex) => Math.max(0, prevIndex - 1));
  };

  const handleNext = () => {
    setCurrentGwIndex((prevIndex) => Math.min(FPL_FIXTURES.length - 1, prevIndex + 1));
  };

  const currentGameweekData = FPL_FIXTURES[currentGwIndex];

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-text mb-4">Fixtures & Results</h1>
        <Card className="border-border shadow-card">
          <CardHeader className="p-0 border-b border-border">
            <GameweekNavigator
              gameweekTitle={currentGameweekData.title}
              gameweekDeadline={currentGameweekData.deadline}
              onPrevious={handlePrevious}
              onNext={handleNext}
              isFirst={currentGwIndex === 0}
              isLast={currentGwIndex === FPL_FIXTURES.length - 1}
            />
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <FixtureList matches={currentGameweekData.matches} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Fixtures;

