"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { th } from "date-fns/locale";
import { Calendar, X, Clock } from "lucide-react";
import {
  formatThaiCaption,
  formatThaiDate,
  toLocalDate,
  toLocalISO,
} from "@/lib/thai-date";
import { cn } from "@/lib/utils";

type Mode = "date" | "datetime";

type Props = {
  name: string;
  mode?: Mode;
  defaultValue?: string | Date | null;
  required?: boolean;
  placeholder?: string;
  className?: string;
  minDate?: Date;
  onChange?: (value: string | null) => void;
};

function parseInitial(v: string | Date | null | undefined): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function ThaiDatePicker({
  name,
  mode = "datetime",
  defaultValue,
  required,
  placeholder = "เลือกวันที่",
  className,
  minDate,
  onChange,
}: Props) {
  const [value, setValue] = useState<Date | null>(() => parseInitial(defaultValue));
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const update = (next: Date | null) => {
    setValue(next);
    onChange?.(
      next
        ? mode === "date"
          ? toLocalDate(next)
          : toLocalISO(next)
        : null,
    );
  };

  const onDateSelect = (d: Date | undefined) => {
    if (!d) return;
    if (mode === "date") {
      update(d);
      setOpen(false);
      return;
    }
    const cur = value ?? new Date();
    const next = new Date(d);
    next.setHours(cur.getHours(), cur.getMinutes(), 0, 0);
    update(next);
  };

  const onTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = e.target.value;
    if (!t) return;
    const [hh, mm] = t.split(":").map(Number);
    const next = value ? new Date(value) : new Date();
    next.setHours(hh ?? 0, mm ?? 0, 0, 0);
    update(next);
  };

  const onClear = () => {
    update(null);
  };

  const hiddenValue = value
    ? mode === "date"
      ? toLocalDate(value)
      : toLocalISO(value)
    : "";

  const display = value
    ? formatThaiDate(value, { withTime: mode === "datetime" })
    : "";

  const timeValue = value
    ? `${value.getHours().toString().padStart(2, "0")}:${value
        .getMinutes()
        .toString()
        .padStart(2, "0")}`
    : "";

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <input
        type="hidden"
        name={name}
        value={hiddenValue}
        required={required}
      />

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-2xl border border-stone-200 bg-white/80 px-4 text-left text-base text-stone-900 shadow-inner outline-none transition-all backdrop-blur-sm",
          "focus-visible:border-brand-500 focus-visible:ring-4 focus-visible:ring-brand-500/15",
          "dark:border-stone-700 dark:bg-stone-900/80 dark:text-stone-100",
          !value && "text-stone-400 dark:text-stone-500",
        )}
      >
        <span className="flex items-center gap-2">
          <Calendar className="size-4 text-brand-600" />
          <span>{display || placeholder}</span>
        </span>
        {value && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onClear();
              }
            }}
            className="rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-100"
            aria-label="clear"
          >
            <X className="size-3.5" />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-stone-200 bg-white p-3 text-stone-900 shadow-2xl dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 scale-in">
          <DayPicker
            mode="single"
            locale={th}
            className="rdp-thai"
            selected={value ?? undefined}
            onSelect={onDateSelect}
            captionLayout="dropdown"
            startMonth={new Date(1950, 0)}
            endMonth={new Date(2100, 11)}
            disabled={minDate ? { before: minDate } : undefined}
            formatters={{
              formatCaption: (date) => formatThaiCaption(date),
              formatYearDropdown: (date) => `พ.ศ. ${date.getFullYear() + 543}`,
            }}
            classNames={{
              caption_label: "rdp-caption_label font-semibold",
              today: "rdp-today text-brand-600 font-bold",
              selected: "rdp-selected",
              chevron: "rdp-chevron fill-stone-500 dark:fill-stone-300",
            }}
          />
          {mode === "datetime" && (
            <div className="mt-2 flex items-center gap-2 border-t border-stone-200 pt-3 dark:border-stone-700">
              <Clock className="size-4 text-stone-500" />
              <input
                type="time"
                value={timeValue}
                onChange={onTimeChange}
                className="flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              >
                ตกลง
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
