/**
 * Climate statistics from daily history: typical weather for the trip dates,
 * a per-month table with a comfort score, and the best months to visit.
 * Pure functions, no I/O.
 */
import type { ClimateMonth } from "./types";

export type DayRecord = { date: string; tMax: number; tMin: number; rainMm: number };

const RAINY_DAY_MM = 1; // standard threshold for a "rainy day"

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Comfort score 0–100. Highs of 20–26 °C are ideal (−4 per degree outside),
 * with penalties for nights below 8 °C and for the share of rainy days.
 */
const COMFY_LOW = 20;
const COMFY_HIGH = 26;

export function comfortScore(tMax: number, tMin: number, rainyDaysPct: number): number {
  let score = 100;
  if (tMax < COMFY_LOW) score -= (COMFY_LOW - tMax) * 4;
  if (tMax > COMFY_HIGH) score -= (tMax - COMFY_HIGH) * 4;
  if (tMin < 8) score -= (8 - tMin) * 1.5;
  score -= rainyDaysPct * 0.6;
  return Math.round(Math.max(0, Math.min(100, score)));
}

/** "MM-DD", used to match the same calendar day across years. */
const monthDay = (iso: string) => iso.slice(5, 10);

/** Every "MM-DD" between start and end inclusive (handles New Year wrap). */
export function calendarDays(startIso: string, endIso: string): Set<string> {
  const out = new Set<string>();
  const d = new Date(startIso + "T00:00:00Z");
  const end = new Date(endIso + "T00:00:00Z");
  for (let i = 0; d <= end && i < 366; i++) {
    out.add(d.toISOString().slice(5, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

export function summarizeClimate(days: DayRecord[], tripStart: string, tripEnd: string) {
  const clean = days.filter((d) => Number.isFinite(d.tMax) && Number.isFinite(d.tMin));

  // Typical weather on the trip's calendar dates, averaged across years.
  const wanted = calendarDays(tripStart, tripEnd);
  const tripDays = clean.filter((d) => wanted.has(monthDay(d.date)));
  const tripTypical = tripDays.length
    ? {
        tMax: round1(avg(tripDays.map((d) => d.tMax))),
        tMin: round1(avg(tripDays.map((d) => d.tMin))),
        rainyDaysPct: Math.round((tripDays.filter((d) => d.rainMm >= RAINY_DAY_MM).length / tripDays.length) * 100),
        rainMm: round1(avg(tripDays.map((d) => d.rainMm))),
      }
    : null;

  const months: ClimateMonth[] = [];
  for (let m = 1; m <= 12; m++) {
    const inMonth = clean.filter((d) => Number(d.date.slice(5, 7)) === m);
    if (!inMonth.length) continue;
    const tMax = round1(avg(inMonth.map((d) => d.tMax)));
    const tMin = round1(avg(inMonth.map((d) => d.tMin)));
    const rainyDaysPct = Math.round((inMonth.filter((d) => d.rainMm >= RAINY_DAY_MM).length / inMonth.length) * 100);
    months.push({ month: m, tMax, tMin, rainyDaysPct, comfort: comfortScore(tMax, tMin, rainyDaysPct) });
  }

  // Top three months by comfort are the "best months".
  const ranked = [...months].sort((a, b) => b.comfort - a.comfort);
  const bestMonths = ranked.slice(0, 3).map((m) => m.month);
  const tripMonth = Number(tripStart.slice(5, 7));
  const rankIndex = ranked.findIndex((m) => m.month === tripMonth);

  return { tripTypical, months, bestMonths, tripMonthRank: rankIndex >= 0 ? rankIndex + 1 : null };
}

export const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
