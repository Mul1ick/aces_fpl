import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-body font-semibold ring-offset-background transition-all duration-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary FPL green button with gradient
        primary: "bg-gradient-to-r from-pl-green to-emerald-400 text-pl-purple shadow-glow-green hover:shadow-glow-green hover:scale-[1.02] active:scale-[0.98]",
        
        // Secondary white outline button
        secondary: "border-2 border-pl-white/20 text-pl-white glass hover:border-pl-white/40 hover:bg-pl-white/10",
        
        // Subtle glass button
        subtle: "glass text-pl-white hover:bg-pl-white/10 hover:border-pl-white/20",
        
        // Hero button for main CTAs
        hero: "bg-gradient-to-r from-pl-cyan to-pl-green text-pl-purple shadow-glow-cyan hover:shadow-glow-cyan hover:scale-[1.02] active:scale-[0.98] font-bold",
        
        // Pink emphasis button
        accent: "bg-pl-pink text-pl-white shadow-glow-pink hover:shadow-glow-pink hover:scale-[1.02] active:scale-[0.98]",
        
        // Ghost button
        ghost: "text-pl-white hover:bg-pl-white/10 rounded-xl",
        
        // Icon button
        icon: "size-10 rounded-xl glass text-pl-white hover:bg-pl-white/10 hover:scale-105",
      },
      size: {
        sm: "h-9 px-3 text-caption",
        default: "h-12 px-6",
        lg: "h-14 px-8 text-h3 font-bold",
        xl: "h-16 px-12 text-h2 font-bold",
        icon: "size-10",
      },
      fullWidth: {
        true: "w-full",
      },
      pill: {
        true: "rounded-full",
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;