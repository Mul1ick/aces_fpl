import * as React from "react";
import { cn } from "@/lib/utils";

export interface PillToggleOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface PillToggleProps {
  options: PillToggleOption[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  size?: "sm" | "default" | "lg";
}

const PillToggle = React.forwardRef<HTMLDivElement, aPillToggleProps>(
  ({ options, value, onValueChange, className, size = "default" }, ref) => {
    
    const buttonSizeClasses = {
      sm: "h-8 px-4 text-sm",
      default: "h-10 px-6 text-sm",
      lg: "h-12 px-8 text-base"
    };

    return (
      // The container now just groups the buttons within a single border
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-full border border-gray-300 overflow-hidden",
          className
        )}
      >
        {options.map((option, index) => (
          <button
            key={option.value}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "font-semibold transition-colors duration-200 flex items-center justify-center", // Base styles
              buttonSizeClasses[size], // Size styles
              // Add a border between the buttons, but not on the last one
              index < options.length - 1 && "border-r border-gray-300",
              // --- CORE LOGIC: Apply styles directly based on active state ---
              value === option.value
                ? "bg-black text-white" // Active Style
                : "bg-white text-black hover:bg-gray-100" // Inactive Style
            )}
          >
            {option.icon}
            {option.label}
          </button>
        ))}
      </div>
    );
  }
);

PillToggle.displayName = "PillToggle";

export { PillToggle };