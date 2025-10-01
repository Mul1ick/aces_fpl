import React, { useMemo } from 'react';
import PlayerCard from '@/components/layout/PlayerCard'; 
import pitchBackground from '@/assets/images/pitch.png';
import { ChipName } from '@/lib/api';

interface PitchViewProps {
  playersByPos: any;
  bench: any[];
  onPlayerClick: (player: any) => void;
  activeChip?: ChipName | null;
}

export const PitchView: React.FC<PitchViewProps> = ({ playersByPos, bench, onPlayerClick, activeChip }) => {
  
  // --- ADDED: Logic to separate the goalkeeper from other subs ---
  const benchLayout = useMemo(() => {
    if (!bench) return { goalkeeper: null, outfielders: [] };
    const goalkeeper = bench.find(p => p.position === 'GK') || null;
    const outfielders = bench.filter(p => p.position !== 'GK');
    return { goalkeeper, outfielders };
  }, [bench]);

  return (
    <>
      <main 
        className="flex-1 relative flex flex-col justify-around py-4"
        style={{ 
          backgroundImage: `url(${pitchBackground})`,
          backgroundSize: 'cover',
           backgroundPosition: 'center top'
        }}
      >
        {/* Goalkeeper (Top of Pitch) */}
        <div className="flex justify-center items-center">
          {playersByPos.GK.map((p: any) => (
            <div key={p.id} onClick={() => onPlayerClick(p)} className="cursor-pointer">
              <PlayerCard 
                player={{
                  id: p.id,
                  name: p.full_name,
                  pos: p.position,
                  team: p.team.name,
                  points: p.points,
                  isCaptain: p.is_captain,
                  isVice: p.is_vice_captain
                }} 
                activeChip={activeChip}
              />
            </div>
          ))}
        </div>

        {/* Defenders */}
        <div className="flex justify-center items-center gap-x-8 sm:gap-x-12">
           {playersByPos.DEF.map((p: any) => (
            <div key={p.id} onClick={() => onPlayerClick(p)} className="cursor-pointer">
              <PlayerCard 
                player={{
                  id: p.id,
                  name: p.full_name,
                  pos: p.position,
                  team: p.team.name,
                  points: p.points,
                  isCaptain: p.is_captain,
                  isVice: p.is_vice_captain
                }} 
                activeChip={activeChip}
              />
            </div>
           ))}
        </div>

        {/* Midfielders */}
        <div className="flex justify-center items-center gap-x-8 sm:gap-x-12">
          {playersByPos.MID.map((p: any) => (
            <div key={p.id} onClick={() => onPlayerClick(p)} className="cursor-pointer">
              <PlayerCard 
                player={{
                  id: p.id,
                  name: p.full_name,
                  pos: p.position,
                  team: p.team.name,
                  points: p.points,
                  isCaptain: p.is_captain,
                  isVice: p.is_vice_captain
                }} 
                activeChip={activeChip}
              />
            </div>
          ))}
        </div>

        {/* Forwards (Bottom of Pitch) */}
        <div className="flex justify-center items-center gap-x-8 sm:gap-x-12">
          {playersByPos.FWD.map((p: any) => (
            <div key={p.id} onClick={() => onPlayerClick(p)} className="cursor-pointer">
              <PlayerCard 
                player={{
                  id: p.id,
                  name: p.full_name,
                  pos: p.position,
                  team: p.team.name,
                  points: p.points ?? 0,
                  isCaptain: p.is_captain,
                  isVice: p.is_vice_captain
                }} 
                activeChip={activeChip}
              />
            </div>
          ))}
        </div>
      </main>

      {/* --- MODIFIED: Updated footer to match the Pick Team page layout --- */}
      <footer className="flex-shrink-0 p-3 bg-gray-100 border-t">
        <div className="flex justify-center items-center gap-x-12">
          {benchLayout.goalkeeper && (
            <div key={benchLayout.goalkeeper.id} onClick={() => onPlayerClick(benchLayout.goalkeeper)} className="cursor-pointer">
              <PlayerCard 
                isBench={true}
                player={{
                  id: benchLayout.goalkeeper.id,
                  name: benchLayout.goalkeeper.full_name,
                  pos: benchLayout.goalkeeper.position,
                  team: benchLayout.goalkeeper.team.name,
                  points: benchLayout.goalkeeper.points,
                  isCaptain: benchLayout.goalkeeper.is_captain,
                  isVice: benchLayout.goalkeeper.is_vice_captain
                }} 
                activeChip={activeChip}
              />
            </div>
          )}
          <div className="h-16 w-px bg-gray-300"></div>
          <div className="grid grid-cols-2 gap-12">
            {benchLayout.outfielders.map((p: any) => (
              <div key={p.id} onClick={() => onPlayerClick(p)} className="cursor-pointer">
                <PlayerCard 
                  isBench={true}
                  player={{
                    id: p.id,
                    name: p.full_name,
                    pos: p.position,
                    team: p.team.name,
                    points: p.points,
                    isCaptain: p.is_captain,
                    isVice: p.is_vice_captain
                  }} 
                  activeChip={activeChip}
                />
              </div>
            ))}
          </div>
        </div>
      </footer>
    </>
  );
};