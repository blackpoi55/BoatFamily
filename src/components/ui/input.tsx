import * as React from "react";
import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-12 w-full rounded-2xl border border-stone-200 bg-white/80 px-4 text-base shadow-inner outline-none transition-all backdrop-blur-sm",
        "placeholder:text-stone-400",
        "focus-visible:border-brand-500 focus-visible:ring-4 focus-visible:ring-brand-500/15 focus-visible:bg-white",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "dark:border-stone-700 dark:bg-stone-900/80 dark:placeholder:text-stone-500 dark:focus-visible:bg-stone-900",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
