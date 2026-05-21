import { addDays, addMonths, addWeeks, addYears } from "date-fns";
import type { ReminderFrequency } from "@prisma/client";

export function computeNextFireAt(
  startAt: Date,
  frequency: ReminderFrequency,
  fromDate: Date = new Date(),
  endAt: Date | null = null,
  lastFiredAt: Date | null = null,
): Date | null {
  if (frequency === "ONCE") {
    if (lastFiredAt) return null;
    return startAt > fromDate ? startAt : startAt;
  }

  let next = lastFiredAt
    ? advance(lastFiredAt, frequency)
    : startAt;

  while (next <= fromDate) {
    next = advance(next, frequency);
  }

  if (endAt && next > endAt) return null;
  return next;
}

function advance(d: Date, frequency: ReminderFrequency): Date {
  switch (frequency) {
    case "DAILY":
      return addDays(d, 1);
    case "WEEKLY":
      return addWeeks(d, 1);
    case "MONTHLY":
      return addMonths(d, 1);
    case "YEARLY":
      return addYears(d, 1);
    case "CUSTOM":
    case "ONCE":
    default:
      return d;
  }
}
