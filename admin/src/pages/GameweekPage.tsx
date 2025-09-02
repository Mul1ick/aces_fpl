import React from 'react';

export function GameweekPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Gameweek Manager</h1>
        <p className="text-muted-foreground">
          Control gameweek progression, enter match statistics, and finalize scoring.
        </p>
      </div>
      
      <div className="bg-card border rounded-lg p-8 admin-card-shadow text-center">
        <h3 className="text-lg font-semibold mb-2">Gameweek Control Coming Soon</h3>
        <p className="text-muted-foreground">
          This page will contain fixture management, stats entry, and point calculation controls.
        </p>
      </div>
    </div>
  );
}