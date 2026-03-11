// FILE: frontend/src/components/fixtures/GameweekNavigator.tsx
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GameweekNavigatorProps {
  gameweekTitle: string;
  gameweekDeadline: string;
  onPrevious: () => void;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export const GameweekNavigator: React.FC<GameweekNavigatorProps> = ({
  gameweekTitle,
  gameweekDeadline,
  onPrevious,
  onNext,
  isFirst,
  isLast,
}) => {
  return (
    <div className="flex items-center justify-between p-3 sm:p-4">
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onPrevious}
        disabled={isFirst}
        className="disabled:opacity-30 shrink-0"
      >
        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-text" />
      </Button>

      <div className="text-center px-2">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-text leading-tight">{gameweekTitle}</h2>
        <p className="text-[10px] sm:text-xs font-semibold text-gray-500 mt-0.5">Deadline: {gameweekDeadline}</p>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={onNext}
        disabled={isLast}
        className="disabled:opacity-30 shrink-0"
      >
        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-text" />
      </Button>
    </div>
  );
};