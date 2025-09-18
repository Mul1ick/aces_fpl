import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FixtureList } from '@/components/fixtures/FixtureList';
import { GameweekNavigator } from '@/components/fixtures/GameweekNavigator';
import { API } from '@/lib/api';
import { getTeamLogo } from '@/lib/player-utils';

// --- Types used by this page ---
interface TeamUI {
  name: string;
  shortName: string;
  logo: string;
}

interface MatchUI {
  date: string;
  homeTeam: TeamUI;
  awayTeam: TeamUI;
  time?: string;
  homeScore?: number | null;
  awayScore?: number | null;
}

interface GameweekDataUI {
  gameweek: number;
  title: string;
  deadline?: string;
  matches: MatchUI[];
}

/** Shape we expect from backend `GET /fixtures` */
interface FixtureFromAPI {
  id: number;
  gameweek_id: number;
  kickoff: string;
  home_score?: number | null;
  away_score?: number | null;
  home: { id: number; name: string; short_name: string };
  away: { id: number; name: string; short_name: string };
}

// --- NEW TYPE ---
interface GameweekFromAPI {
    id: number;
    gw_number: number;
    deadline: string;
}

const Fixtures: React.FC = () => {
  const [allByGw, setAllByGw] = useState<Record<number, GameweekDataUI>>({});
  const [gwKeys, setGwKeys] = useState<number[]>([]);
  const [currentGwIndex, setCurrentGwIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // --- MODIFIED: This useEffect now fetches both fixtures and the current gameweek ---
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    (async () => {
      try {
        // Fetch fixtures and current gameweek data concurrently
        const [fixturesRes, currentGwRes] = await Promise.all([
            fetch(API.endpoints.fixtures, { headers }),
            fetch(`${API.BASE_URL}/gameweeks/gameweek/current`, { headers })
        ]);

        if (!fixturesRes.ok) {
          throw new Error(`GET /fixtures failed: ${fixturesRes.status}`);
        }
        if (!currentGwRes.ok) {
            console.warn("Could not fetch current gameweek, defaulting to first available.");
        }

        const fixtures: FixtureFromAPI[] = await fixturesRes.json();
        const currentGwData: GameweekFromAPI | null = currentGwRes.ok ? await currentGwRes.json() : null;

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
              });

              const timeStr = dt.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              });

              const homeShort = f.home?.short_name || '';
              const awayShort = f.away?.short_name || '';

              const homeTeam: TeamUI = {
                name: f.home?.name || homeShort,
                shortName: homeShort,
                logo: getTeamLogo(homeShort),
              };
              const awayTeam: TeamUI = {
                name: f.away?.name || awayShort,
                shortName: awayShort,
                logo: getTeamLogo(awayShort),
              };

              const finished = typeof f.home_score === 'number' && typeof f.away_score === 'number';

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

        const keys = Object.keys(byGw)
          .map(Number)
          .sort((a, b) => a - b);

        setAllByGw(byGw);
        setGwKeys(keys);

        // --- MODIFIED: Set the index to the current gameweek ---
        if (currentGwData) {
            const initialIndex = keys.indexOf(currentGwData.id);
            setCurrentGwIndex(initialIndex !== -1 ? initialIndex : 0);
        } else {
            setCurrentGwIndex(0); // Fallback to the first gameweek
        }

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