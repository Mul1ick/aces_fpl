import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface CardProps {
  variant?: "default" | "glass" | "hero" | "pitch";
  animated?: boolean;
  hover?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", animated = true, hover = false, children }, ref) => {
    const baseClasses = "rounded-2xl border shadow-card";
    
    const variantClasses = {
      default: "gradient-card border-pl-border text-card-foreground",
      glass: "glass border-pl-border text-pl-white",
      hero: "gradient-hero border-transparent text-pl-purple",
      pitch: "gradient-pitch border-pitch-line/20 text-pl-white"
    };
    
    const hoverClasses = hover ? "hover-lift cursor-pointer" : "";
    
    const motionProps = animated ? {
      initial: { opacity: 0, y: 8 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] as const }
    } : {};

    return (
      <motion.div
        ref={ref}
        className={cn(baseClasses, variantClasses[variant], hoverClasses, className)}
        {...(animated ? motionProps : {})}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-2 p-6 pb-4", className)}
      {...props}
    />
  )
);

CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-h2 font-bold leading-none tracking-tight", className)}
      {...props}
    />
  )
);

CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-caption text-muted-foreground", className)}
      {...props}
    />
  )
);

CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
);

CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  )
);

CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };