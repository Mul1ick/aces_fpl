import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompactInputProps {
  value: number;
  onValueChange: (newValue: number) => void;
  min?: number;
  max?: number;
}

export function CompactInput({ value, onValueChange, min = 0, max = 99 }: CompactInputProps) {
  const handleIncrement = () => {
    if (value < max) onValueChange(value + 1);
  };
  const handleDecrement = () => {
    if (value > min) onValueChange(value - 1);
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseInt(e.target.value, 10);
    if (!isNaN(num) && num >= min && num <= max) {
      onValueChange(num);
    } else if (e.target.value === '') {
      onValueChange(min);
    }
  };

  return (
    <div className="flex items-center justify-center">
      <div className={cn(
        "flex items-center rounded-md border transition-colors",
        value > 0 ? 'border-primary bg-primary/5' : 'border-input bg-background'
      )}>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-7 rounded-r-none border-r"
          onClick={handleDecrement}
          disabled={value <= min}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Input
          type="number"
          value={value}
          onChange={handleChange}
          className="h-8 w-10 shrink-0 rounded-none border-0 bg-transparent text-center font-bold text-foreground p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-7 rounded-l-none border-l"
          onClick={handleIncrement}
          disabled={value >= max}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}