import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const mockFixtures = {
  previous: [
    { homeTeam: 'Satan', awayTeam: 'Bandra United', homeScore: 2, awayScore: 1 },
    { homeTeam: 'Mumbai Hotspurs', awayTeam: 'Southside', homeScore: 1, awayScore: 1 },
  ],
  current: [
    { homeTeam: 'Titans', awayTeam: 'Umaag Foundation Trust' },
    { homeTeam: 'Satan', awayTeam: 'Southside' },
  ],
  next: [
    { homeTeam: 'Bandra United', awayTeam: 'Mumbai Hotspurs' },
    { homeTeam: 'Titans', awayTeam: 'Satan' },
  ]
};

export const FixturesCard: React.FC = () => {
  const [view, setView] = useState<'previous' | 'current' | 'next'>('current');

  return (
    <Card className="border-gray-300 border-2">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Fixtures</CardTitle>
          <div className="bg-gray-200 rounded-full p-1 flex">
            <button onClick={() => setView('previous')} className={cn("px-3 py-1 text-xs font-semibold rounded-full", view === 'previous' ? 'bg-white shadow' : 'text-gray-600')}>Prev</button>
            <button onClick={() => setView('current')} className={cn("px-3 py-1 text-xs font-semibold rounded-full", view === 'current' ? 'bg-white shadow' : 'text-gray-600')}>Current</button>
            <button onClick={() => setView('next')} className={cn("px-3 py-1 text-xs font-semibold rounded-full", view === 'next' ? 'bg-white shadow' : 'text-gray-600')}>Next</button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {mockFixtures[view].map((fixture, index) => (
            <div key={index} className="grid grid-cols-3 items-center bg-gray-50 p-2 rounded-md text-black">
              <span className="font-semibold text-sm text-right">{fixture.homeTeam}</span>
              <span className="font-bold text-lg text-center mx-auto">
                {fixture.homeScore !== undefined ? `${fixture.homeScore} - ${fixture.awayScore}` : 'vs'}
              </span>
              <span className="font-semibold text-sm text-left">{fixture.awayTeam}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
