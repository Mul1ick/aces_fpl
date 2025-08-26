import * as React from "react";
import { motion } from "framer-motion";
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

const PillToggle = React.forwardRef<HTMLDivElement, PillToggleProps>(
  ({ options, value, onValueChange, className, size = "default" }, ref) => {
    const sizeClasses = {
      sm: "h-8 text-caption px-1",
      default: "h-10 text-body px-1.5",
      lg: "h-12 text-h3 px-2"
    };
    
    const buttonSizeClasses = {
      sm: "h-6 px-3 text-caption",
      default: "h-8 px-4 text-body",
      lg: "h-10 px-6 text-h3"
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center rounded-full glass border border-pl-border",
          sizeClasses[size],
          className
        )}
      >
        {options.map((option, index) => (
          <motion.button
            key={option.value}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "relative z-10 inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-200",
              buttonSizeClasses[size],
              value === option.value 
                ? "text-pl-purple" 
                : "text-pl-white hover:text-pl-cyan"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {option.icon}
            {option.label}
            
            {value === option.value && (
              <motion.div
                layoutId="pill-toggle-indicator"
                className="absolute inset-0 bg-gradient-to-r from-pl-cyan to-pl-green rounded-full shadow-glow-cyan"
                initial={false}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 24
                }}
              />
            )}
          </motion.button>
        ))}
      </div>
    );
  }
);

PillToggle.displayName = "PillToggle";

export { PillToggle };