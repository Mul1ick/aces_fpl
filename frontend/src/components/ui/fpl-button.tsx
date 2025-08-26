import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { buttonVariants, type ButtonVariants } from "./button-variants";

export interface ButtonProps extends ButtonVariants {
  asChild?: boolean;
  loading?: boolean;
  animated?: boolean;
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    fullWidth, 
    pill,
    asChild = false, 
    loading = false,
    animated = true,
    children,
    disabled,
    onClick,
    type = "button"
  }, ref) => {
    const Comp = asChild ? Slot : motion.button;
    
    const motionProps = animated ? {
      whileHover: { scale: variant === "icon" ? 1.05 : 1.02 },
      whileTap: { scale: 0.98 },
      transition: { type: "spring" as const, stiffness: 260, damping: 24 }
    } : {};

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, pill, className }))}
        ref={ref}
        disabled={disabled || loading}
        onClick={onClick}
        type={type}
        {...(animated ? motionProps : {})}
      >
        {loading ? (
          <motion.div
            className="size-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        ) : null}
        {children}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button };