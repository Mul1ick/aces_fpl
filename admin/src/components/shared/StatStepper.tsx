import React from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatStepperProps {
  label: string;
  value: number;
  onValueChange: (newValue: number) => void;
  icon?: React.ReactNode;
  min?: number;
  max?: number;
}

export function StatStepper({ label, value, onValueChange, icon, min = 0, max = 99 }: StatStepperProps) {
  const handleIncrement = () => {
    if (value < max) {
      onValueChange(value + 1);
    }
  };

  const handleDecrement = () => {
    if (value > min) {
      onValueChange(value - 1);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1 text-xs text-muted-foreground font-semibold">
        {icon}
        <span>{label}</span>
      </div>
      <div className={cn(
        "flex items-center gap-1 p-0.5 rounded-md transition-colors",
        value > 0 ? 'bg-primary/10' : 'bg-muted/60'
      )}>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 rounded-sm"
          onClick={handleDecrement}
          disabled={value <= min}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-6 text-center font-bold tabular-nums text-foreground">{value}</span>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 rounded-sm"
          onClick={handleIncrement}
          disabled={value >= max}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}