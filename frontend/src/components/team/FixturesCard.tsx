import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from '@/lib/utils';

// --- MODIFIED: Component now accepts props ---
interface FixturesCardProps {
  fixtures: any[];
  view: 'previous' | 'current' | 'next';
  setView: (view: 'previous' | 'current' | 'next') => void;
  currentGwNumber?: number;
}

export const FixturesCard: React.FC<FixturesCardProps> = ({ fixtures, view, setView, currentGwNumber }) => {
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
          {/* --- MODIFIED: Render fixtures from props --- */}
          {fixtures.length > 0 ? fixtures.map((fixture) => (
            <div key={fixture.id} className="grid grid-cols-3 items-center bg-gray-50 p-2 rounded-md text-black">
              <span className="font-semibold text-sm text-right">{fixture.home.name}</span>
              <span className="font-bold text-lg text-center mx-auto">
                {fixture.home_score !== null && fixture.away_score !== null
                  ? `${fixture.home_score} - ${fixture.away_score}`
                  : new Date(fixture.kickoff).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="font-semibold text-sm text-left">{fixture.away.name}</span>
            </div>
          )) : (
            <p className="text-center text-sm text-gray-500 py-4">No fixtures available for this gameweek.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};