import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-ink-600 text-white hover:bg-ink-700 disabled:bg-stone-300 disabled:text-stone-500",
  secondary:
    "border border-stone-300 bg-white text-stone-900 hover:border-ink-300 hover:bg-ink-50 disabled:border-stone-200 disabled:bg-stone-100 disabled:text-stone-400",
  ghost:
    "text-ink-600 hover:bg-ink-50 disabled:text-stone-400 disabled:hover:bg-transparent",
};

const sizeClasses: Record<ButtonSize, string> = {
  md: "h-10 px-4 text-small font-medium",
  lg: "h-12 px-6 text-body font-medium",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ variant = "primary", size = "md", className, type, ...props }, ref) {
    return (
      <button
        ref={ref}
        type={type ?? "button"}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md transition-colors",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600",
          "disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);
