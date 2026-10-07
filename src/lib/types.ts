/**
 * Zod schemas and types for trip input, the model's report and fetched facts.
 * Input schemas validate requests; the report schema is lenient (`.catch`)
 * so small model mistakes degrade a field instead of failing the briefing.
 */
import { z } from "zod";

// ── Trip input ──────────────────────────────────────────────────────────────

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must look like 2026-10-31");

export const StopSchema = z.object({
  name: z.string().min(1).max(120),
  country: z.string().max(120).default(""),
  countryCode: z.string().max(4).default(""),
  admin: z.string().max(120).default(""), // region/state, disambiguates same-named places
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  timezone: z.string().max(80).default("auto"),
  startDate: isoDate,
  endDate: isoDate,
});
export type Stop = z.infer<typeof StopSchema>;

const GROUPS = ["solo", "couple", "family", "friends", "business"] as const;
const PURPOSES = ["leisure", "culture", "adventure", "relaxation", "romance", "work", "family-visit"] as const;
const PACES = ["relaxed", "balanced", "packed"] as const;
const BUDGETS = ["shoestring", "comfortable", "luxury"] as const;
export const INTERESTS = [
  "food", "history", "art", "nature", "beaches", "hiking", "nightlife",
  "shopping", "photography", "architecture", "local-life", "wellness",
] as const;
export const CONCERNS = [
  "heat", "cold", "rain", "crowds", "safety", "health", "mobility", "dietary", "budget",
] as const;

export const TripInputSchema = z.object({
  stops: z.array(StopSchema).min(1, "Add at least one stop").max(5, "Up to 5 stops"),
  homeCity: z.string().max(120).default(""),
  group: z.enum(GROUPS),
  withKids: z.boolean().default(false),
  withSeniors: z.boolean().default(false),
  purpose: z.enum(PURPOSES),
  pace: z.enum(PACES),
  budget: z.enum(BUDGETS),
  interests: z.array(z.enum(INTERESTS)).max(12).default([]),
  concerns: z.array(z.enum(CONCERNS)).max(9).default([]),
  notes: z.string().max(500).default(""),
});
export type TripInput = z.infer<typeof TripInputSchema>;

// ── Model report ────────────────────────────────────────────────────────────

// Trimmed string; overlong values are truncated rather than rejected.
const text = (max = 600) => z.string().trim().transform((s) => (s.length > max ? s.slice(0, max - 1) + "…" : s));
const list = <T extends z.ZodTypeAny>(item: T, max: number) =>
  z.array(z.unknown()).catch([]).transform((arr) =>
    arr.flatMap((x) => {
      const r = item.safeParse(x); // drop invalid items, keep the rest
      return r.success ? [r.data as z.infer<T>] : [];
    }).slice(0, max),
  );

const FactorSchema = z.object({
  factor: z.enum(["weather", "safety", "news", "season"]).catch("season"),
  impact: z.enum(["positive", "neutral", "negative"]).catch("neutral"),
  text: text(240),
});

const HeadsUpSchema = z.object({
  title: text(90),
  detail: text(320),
  severity: z.enum(["info", "caution", "warning"]).catch("info"),
  stop: text(120).optional().catch(undefined),
});

const TodoSchema = z.object({
  title: text(90),
  detail: text(280),
  stop: text(120).optional().catch(undefined),
  category: z.enum(["see", "do", "eat", "book-ahead", "admin"]).catch("do"),
  bestWhen: text(80).optional().catch(undefined), // e.g. "a dry morning", "Day 2"
});

const PackingGroupSchema = z.object({
  category: text(40),
  items: list(z.object({ item: text(60), why: text(160) }), 10),
});

const NewsPickSchema = z.object({
  id: z.string().max(8), // id of a fetched article, e.g. "N3"
  takeaway: text(240),
});

const TipSchema = z.object({ title: text(90), detail: text(320) });

const AltDestinationSchema = z.object({
  name: text(80),
  country: text(80).catch(""),
  why: text(280),
});

export const AiReportSchema = z.object({
  verdict: z.object({
    score: z.coerce.number().catch(5).transform((n) => Math.min(10, Math.max(1, Math.round(n * 10) / 10))),
    label: text(40).catch(""),
    summary: text(420),
    factors: list(FactorSchema, 4),
  }),
  headsUp: list(HeadsUpSchema, 8),
  todo: list(TodoSchema, 10),
  packing: list(PackingGroupSchema, 6),
  news: z.object({
    mood: z.enum(["calm", "mixed", "concerning", "unknown"]).catch("unknown"),
    summary: text(420).catch(""),
    picks: list(NewsPickSchema, 6),
  }).catch({ mood: "unknown", summary: "", picks: [] }),
  tips: list(TipSchema, 6),
  alternatives: z.object({
    destinations: list(AltDestinationSchema, 3),
    timing: text(420).catch(""),
  }).catch({ destinations: [], timing: "" }),
});
export type AiReport = z.infer<typeof AiReportSchema>;

// ── Fetched facts ───────────────────────────────────────────────────────────

export type DailyWeather = {
  date: string;
  code: number; // WMO weather code
  tMax: number;
  tMin: number;
  rainChance: number | null; // %
  rainMm: number;
  uv: number | null;
  windKmh: number | null;
};

export type ClimateMonth = {
  month: number; // 1–12
  tMax: number;
  tMin: number;
  rainyDaysPct: number; // % of days with ≥1 mm rain
  comfort: number; // 0–100, see comfortScore()
};

export type StopWeather = {
  mode: "forecast" | "climate"; // "climate" when the trip is beyond the forecast range
  forecast: DailyWeather[];
  tripTypical: { tMax: number; tMin: number; rainyDaysPct: number; rainMm: number } | null;
  months: ClimateMonth[];
  bestMonths: number[];
  tripMonthRank: number | null; // 1 = best month of the year
  yearsUsed: string; // e.g. "2021–2025"
};

export type NewsItem = {
  id: string;
  title: string;
  source: string;
  url: string;
  date: string; // ISO
  stop: string;
};

export type Advisory = {
  country: string;
  url: string;
  alerts: string[]; // e.g. "avoid_all_but_essential_travel_to_parts"
  updated: string;
  summary: string;
};

export type StopFacts = {
  stop: Stop;
  weather: StopWeather | null;
  news: NewsItem[];
  guide: { url: string; sections: Record<string, string> } | null;
  advisory: Advisory | null;
  problems: string[]; // sources that failed for this stop
};

/** A finished briefing: trip input, fetched facts and the model's report. */
export type Briefing = {
  id: string;
  createdAt: string;
  trip: TripInput;
  facts: StopFacts[];
  ai: AiReport;
  model: string;
};

/** NDJSON events streamed by /api/briefing. */
export type ProgressEvent =
  | { type: "step"; step: "places" | "weather" | "news" | "guides" | "advisories" | "writing" | "checking"; detail?: string }
  | { type: "done"; briefing: Briefing; cached: boolean }
  | { type: "error"; message: string; hint?: string };
