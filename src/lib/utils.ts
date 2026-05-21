import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTHB(amount: number | string) {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Use explicit MIME types instead of "image/*" so Android Chrome opens the
// standard file chooser (camera + local Files + Drive) rather than the
// system Photo Picker that only surfaces Google Photos.
export const IMAGE_ACCEPT =
  "image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic,image/heif";
