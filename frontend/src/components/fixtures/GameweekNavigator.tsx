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
    <div className="flex items-center justify-between p-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={onPrevious}
        disabled={isFirst}
        className="disabled:opacity-30"
      >
        <ChevronLeft className="w-6 h-6 text-text" />
      </Button>

      <div className="text-center">
        <h2 className="text-xl md:text-2xl font-bold text-text">{gameweekTitle}</h2>
        <p className="text-xs text-text-muted">Deadline: {gameweekDeadline}</p>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={onNext}
        disabled={isLast}
        className="disabled:opacity-30"
      >
        <ChevronRight className="w-6 h-6 text-text" />
      </Button>
    </div>
  );
};

