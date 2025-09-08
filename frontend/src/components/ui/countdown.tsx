import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface CountdownProps {
  targetDate: Date;
  className?: string;
  size?: "sm" | "default" | "lg";
  showLabels?: boolean;
  urgent?: boolean; // Changes color when < 5 minutes
}

interface TimeUnit {
  value: number;
  label: string;
}

const Countdown: React.FC<CountdownProps> = ({
  targetDate,
  className,
  size = "default",
  showLabels = true,
  urgent = true
}) => {
  const [timeLeft, setTimeLeft] = React.useState<TimeUnit[]>([]);
  const [isUrgent, setIsUrgent] = React.useState(false);

  React.useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime();
      
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        
        // Check if urgent (less than 5 minutes)
        const totalMinutes = Math.floor(difference / (1000 * 60));
        setIsUrgent(urgent && totalMinutes < 5);
        
        setTimeLeft([
          { value: days, label: "Days" },
          { value: hours, label: "Hours" },
          { value: minutes, label: "Mins" },
          { value: seconds, label: "Secs" }
        ]);
      } else {
        setTimeLeft([]);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate, urgent]);

  if (timeLeft.length === 0) {
    return (
      <div className={cn("text-pl-pink font-bold", className)}>
        Deadline Passed
      </div>
    );
  }

  const sizeClasses = {
    sm: "text-caption gap-1",
    default: "text-body gap-2", 
    lg: "text-h2 gap-3"
  };

  const numberClasses = {
    sm: "text-mini",
    default: "text-caption",
    lg: "text-h3"
  };

  return (
    <div className={cn(
      "inline-flex items-center tabular-nums",
      sizeClasses[size],
      isUrgent ? "text-pl-pink animate-glow-pulse" : "text-pl-white",
      className
    )}>
      <AnimatePresence mode="wait">
        {timeLeft.map((unit, index) => (
          <motion.div
            key={unit.label}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className="flex flex-col items-center"
          >
            <motion.span
              key={unit.value}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="font-bold"
            >
              {unit.value.toString().padStart(2, "0")}
            </motion.span>
            {showLabels && (
              <span className={cn(
                "opacity-60",
                numberClasses[size]
              )}>
                {unit.label}
              </span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export { Countdown };