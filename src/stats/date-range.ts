import { DateTime } from "effect";
import type { DateRange } from "../api/oura-api";

const lookbackDays = 3;

const isoDate = (date: DateTime.DateTime) => {
  const parts = DateTime.toParts(date);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
};

/* Oura's sleep and daily_activity collections exclude end_date, so the
   range runs through tomorrow to include last night and today. */
export const recentRange = (today: DateTime.DateTime): DateRange => ({
  startDate: isoDate(DateTime.subtract(today, { days: lookbackDays })),
  endDate: isoDate(DateTime.add(today, { days: 1 })),
});

export const todayIso = (today: DateTime.DateTime) => isoDate(today);
