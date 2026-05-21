import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const sizeClasses: Record<Size, string> = {
  xs: "size-5 text-[8px]",
  sm: "size-7 text-[10px]",
  md: "size-9 text-xs",
  lg: "size-12 text-sm",
  xl: "size-16 text-base",
};

type Props = {
  name: string;
  src?: string | null;
  size?: Size;
  className?: string;
};

export function Avatar({ name, src, size = "md", className }: Props) {
  const classes = cn(
    "flex shrink-0 items-center justify-center rounded-full font-semibold overflow-hidden",
    sizeClasses[size],
    !src && "bg-gradient-to-br from-brand-400 to-brand-600 text-white",
    className,
  );

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        loading="lazy"
        className={cn(classes, "object-cover")}
      />
    );
  }
  return <span className={classes}>{getInitials(name)}</span>;
}
