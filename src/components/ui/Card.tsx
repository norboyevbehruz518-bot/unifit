import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  /** Optional card heading, rendered as an h3. */
  title?: string;
  padding?: "md" | "lg";
}

export function Card({
  title,
  padding = "md",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <section
      className={cn(
        "rounded-lg border border-stone-200 bg-white shadow-card",
        padding === "md" ? "p-6" : "p-8",
        className,
      )}
      {...props}
    >
      {title && (
        <h3 className="mb-4 text-h3 font-semibold text-stone-900">{title}</h3>
      )}
      {children}
    </section>
  );
}
