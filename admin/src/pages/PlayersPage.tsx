import React from 'react';

export function PlayersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Player Management</h1>
        <p className="text-muted-foreground">
          Add, edit, and manage all players in the FPL database.
        </p>
      </div>
      
      <div className="bg-card border rounded-lg p-8 admin-card-shadow text-center">
        <h3 className="text-lg font-semibold mb-2">Player Management Coming Soon</h3>
        <p className="text-muted-foreground">
          This page will contain player CRUD operations, team assignments, and statistics management.
        </p>
      </div>
    </div>
  );
}