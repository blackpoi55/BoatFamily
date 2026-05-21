import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "text-white shadow-lg shadow-brand-500/30 hover:shadow-xl hover:shadow-brand-500/40 gradient-brand",
        secondary:
          "border border-stone-200 bg-white text-stone-900 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:hover:bg-stone-800",
        ghost:
          "text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800",
        danger:
          "bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-md shadow-rose-500/30 hover:shadow-lg hover:shadow-rose-500/40",
      },
      size: {
        sm: "h-9 px-3 text-sm rounded-xl",
        md: "h-11 px-4 text-base",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "lg" },
  },
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { buttonVariants };
