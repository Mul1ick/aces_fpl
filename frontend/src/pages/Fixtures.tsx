import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FixtureList } from '@/components/fixtures/FixtureList';
import { GameweekNavigator } from '@/components/fixtures/GameweekNavigator';

// --- LOGO IMPORTS ---
import redLogo from '@/assets/images/team-logos/red.png';
import blueLogo from '@/assets/images/team-logos/blue.png';
import blackLogo from '@/assets/images/team-logos/black.png';
import whiteLogo from '@/assets/images/team-logos/white.png';
import greyLogo from '@/assets/images/team-logos/grey.png';
import yellowLogo from '@/assets/images/team-logos/yellow.png';

/** 🔁 IMPORTANT: use YOUR teams' short_names from the backend
 *  In your DB you have: BAN, SOU, TIT, SAT (and whatever else you added).
 *  Add/adjust mappings here so logos show correctly.
 */
const LOGO_MAP: Record<string, string> = {
  BAN: blueLogo,       // Bandra United
  SOU: redLogo,        // Southside FC   (you used "SOU")
  TIT: greyLogo,       // Titans
  SAT: redLogo,        // Satan
  // Add more if you have more teams
};

// --- Types used by this page ---
interface TeamUI {
  name: string;
  shortName: string;
  logo: string;
}

interface MatchUI {
  date: string;               // "Sat 13 Sep"
  homeTeam: TeamUI;
  awayTeam: TeamUI;
  time?: string;              // "17:00" (if future)
  homeScore?: number | null;  // show if finished
  awayScore?: number | null;
}

interface GameweekDataUI {
  gameweek: number;           // gw_number
  title: string;              // "Gameweek X"
  deadline?: string;          // optional (if you later fetch deadlines)
  matches: MatchUI[];
}

/** Shape we expect from backend `GET /fixtures` (based on your route) */
interface FixtureFromAPI {
  id: number;
  gameweek_id: number;
  kickoff: string;            // ISO
  home_score?: number | null;
  away_score?: number | null;
  home: { id: number; name: string; short_name: string };
  away: { id: number; name: string; short_name: string };
}

const Fixtures: React.FC = () => {
  const [allByGw, setAllByGw] = useState<Record<number, GameweekDataUI>>({});
  const [gwKeys, setGwKeys] = useState<number[]>([]);
  const [currentGwIndex, setCurrentGwIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch fixtures once
  useEffect(() => {
    const token = localStorage.getItem('access_token');

    (async () => {
      try {
        const res = await fetch('http://localhost:8000/fixtures', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          throw new Error(`GET /fixtures failed: ${res.status}`);
        }
        const fixtures: FixtureFromAPI[] = await res.json();

        // Group by gameweek_id
        const grouped = fixtures.reduce<Record<number, FixtureFromAPI[]>>((acc, f) => {
          acc[f.gameweek_id] = acc[f.gameweek_id] || [];
          acc[f.gameweek_id].push(f);
          return acc;
        }, {});

        // Transform to UI-friendly structure
        const byGw: Record<number, GameweekDataUI> = {};
        Object.entries(grouped).forEach(([gwIdStr, list]) => {
          const gwId = Number(gwIdStr);

          const matches: MatchUI[] = list
            .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime())
            .map((f) => {
              const dt = new Date(f.kickoff);
              const dateStr = dt.toLocaleDateString(undefined, {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
              }); // e.g., "Sat, 13 Sep"

              const timeStr = dt.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              }); // "17:00"

              const homeShort = f.home?.short_name || '';
              const awayShort = f.away?.short_name || '';

              const homeTeam: TeamUI = {
                name: f.home?.name || homeShort,
                shortName: homeShort,
                logo: LOGO_MAP[homeShort] || whiteLogo,
              };
              const awayTeam: TeamUI = {
                name: f.away?.name || awayShort,
                shortName: awayShort,
                logo: LOGO_MAP[awayShort] || whiteLogo,
              };

              const finished =
                typeof f.home_score === 'number' && typeof f.away_score === 'number';

              return {
                date: dateStr,
                homeTeam,
                awayTeam,
                time: finished ? undefined : timeStr,
                homeScore: finished ? f.home_score : undefined,
                awayScore: finished ? f.away_score : undefined,
              };
            });

          byGw[gwId] = {
            gameweek: gwId,
            title: `Gameweek ${gwId}`,
            matches,
          };
        });

        // Sort keys (gameweeks) ascending
        const keys = Object.keys(byGw)
          .map(Number)
          .sort((a, b) => a - b);

        setAllByGw(byGw);
        setGwKeys(keys);
        setCurrentGwIndex(0); // start at the first gw present (you can jump to "current" if you want)
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const currentGw = gwKeys[currentGwIndex];
  const currentData = currentGw ? allByGw[currentGw] : undefined;

  const handlePrevious = () => {
    setCurrentGwIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentGwIndex((prev) => Math.min(gwKeys.length - 1, prev + 1));
  };

  if (loading) {
    return <div className="p-6">Loading fixtures…</div>;
  }

  if (!currentData) {
    return <div className="p-6">No fixtures found.</div>;
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-text mb-4">Fixtures & Results</h1>

        <Card className="border-border shadow-card">
          <CardHeader className="p-0 border-b border-border">
            <GameweekNavigator
              gameweekTitle={currentData.title}
              // If you later want the actual deadline, fetch /gameweeks and add it here
              gameweekDeadline={undefined}
              onPrevious={handlePrevious}
              onNext={handleNext}
              isFirst={currentGwIndex === 0}
              isLast={currentGwIndex === gwKeys.length - 1}
            />
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <FixtureList matches={currentData.matches} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Fixtures;