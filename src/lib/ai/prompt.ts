/**
 * Prompt construction: a system prompt with output rules and JSON shape, and
 * a user message containing the fact pack (trip profile plus all fetched
 * data as compact text). News is referenced by id so links come from our data.
 */
import { MONTH_NAMES } from "../climate";
import { describeSky } from "../weather-codes";
import type { StopFacts, TripInput } from "../types";
import type { ChatMessage } from "./gemini";

const OUTPUT_SHAPE = `{
  "verdict": {
    "score": 7.5,                       // 1–10: how good is it to do THIS trip on THESE dates
    "label": "Good time to go",         // 2–5 words
    "summary": "2–3 sentences, plain and specific.",
    "factors": [                        // exactly 4, one per factor
      {"factor": "weather", "impact": "positive|neutral|negative", "text": "one sentence"},
      {"factor": "safety",  "impact": "...", "text": "..."},
      {"factor": "news",    "impact": "...", "text": "..."},
      {"factor": "season",  "impact": "...", "text": "crowds / prices / events in this season"}
    ]
  },
  "headsUp": [ {"title": "...", "detail": "...", "severity": "info|caution|warning", "stop": "city name or omit"} ],   // 3–7 things to note
  "todo":    [ {"title": "...", "detail": "...", "category": "see|do|eat|book-ahead|admin", "stop": "city", "bestWhen": "e.g. Oct 13 (forecast dry) — only from the forecast, or omit"} ], // 4–10
  "packing": [ {"category": "Clothing", "items": [ {"item": "Light rain jacket", "why": "showers likely on 2 of 6 days"} ]} ], // 3–5 groups: Clothing, Gear, Health, Documents & money, Tech
  "news": { "mood": "calm|mixed|concerning|unknown", "summary": "2 sentences on what's happening there", "picks": [ {"id": "N3", "takeaway": "why this matters to the traveller"} ] }, // 2–5 picks, ONLY ids from the fact pack
  "tips": [ {"title": "...", "detail": "..."} ],  // 2–5: customs, transport, money, scams, etiquette
  "alternatives": {
    "destinations": [ {"name": "...", "country": "...", "why": "why it's a good swap for this traveller right now"} ], // 2–3, preferably from the guide's [Go next]
    "timing": "When would be better (or why now is ideal), using the BEST MONTHS data."
  }
}`;

const SYSTEM_PROMPT = `You are Tripcast, a careful, warm travel-briefing editor.
You write a pre-trip briefing for one traveller, using ONLY the FACT PACK you are given.
Accuracy matters more than length: a short briefing that is true beats a long one with guesses.

What you MAY write:
A. Anything stated in the fact pack (weather lines, safety advice, travel guide, news headlines).
   USE the real names the fact pack gives you (sights, districts, dishes, nearby towns): "visit Kinkaku-ji"
   is far more useful than "visit a famous temple". Being specific is good when the name is in the facts.
B. Simple, timeless common sense that needs no specifics (e.g. "carry some cash", "wear shoes you can walk in all day").

What you must NOT write unless it appears in the fact pack:
- Names of businesses: restaurants, hotels, shops, tour companies, transport operators, apps, websites.
- Names of sights, neighbourhoods, events, festivals or dishes that the fact pack doesn't mention.
  For those, describe them generally instead ("a multi-course dinner", "an early visit to a major temple").
- Dates or seasons of events, blossoms, foliage, festivals or holidays; opening hours; prices;
  booking, visa or entry rules.
- Any number (°C, %, mm, km/h, days, distances, prices) that is not in the fact pack. Copy numbers
  exactly as given (you may round temperatures to whole degrees).
- Anything about a news story beyond what its headline says.

Rules:
1. Weather statements come only from the WEATHER / TYPICAL / BEST MONTHS / MONTHLY lines. "bestWhen" may
   only name a day the forecast actually describes (e.g. low rain chance); otherwise omit it.
2. Safety statements come only from the SAFETY section. If none is given, say official advice wasn't available.
3. News: only use headlines listed with ids (N1, N2…). Refer to them by id in "news.picks". Never write URLs.
   If no headline matters to a traveller, use mood "calm" or "unknown" and pick nothing.
4. Tailor everything to the traveller profile (group, kids/seniors, purpose, pace, budget, interests, concerns, notes).
5. Packing must follow from the weather and activities (say why for each item). No generic filler like "clothes".
   Give 3–5 groups (e.g. Clothing, Gear, Health, Documents & money, Tech) with 2–5 items each.
6. Short, concrete sentences. No hype words.
7. Alternatives: prefer places named in the guide's [Go next] section (or elsewhere in the fact pack). Timing must use the BEST MONTHS / MONTHLY data.
8. If the facts for a section are thin, write fewer items — never pad. When unsure whether something is true
   for this place and these dates, leave it out.
9. Reply with ONE JSON object only — no markdown, no comments, no text before or after.

JSON shape (comments are explanations, do not include them):
${OUTPUT_SHAPE}`;

const fmtTemp = (n: number) => (Number.isFinite(n) ? `${Math.round(n)}°C` : "?");

function nightsBetween(a: string, b: string) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

/** Shortens long sections when there are many stops, to bound prompt size. */
function shrink(s: string, factor: number) {
  return factor >= 1 ? s : s.slice(0, Math.round(s.length * factor)) + "…";
}

export function buildFactPack(trip: TripInput, facts: StopFacts[], today: string): string {
  const shrinkBy = facts.length <= 2 ? 1 : facts.length === 3 ? 0.7 : 0.5;
  const who = [
    trip.group,
    trip.withKids ? "travelling with children" : "",
    trip.withSeniors ? "travelling with older adults" : "",
  ].filter(Boolean).join(", ");

  const lines: string[] = [
    `TODAY: ${today}`,
    `TRAVELLER: ${who}. Purpose: ${trip.purpose}. Pace: ${trip.pace}. Budget: ${trip.budget}.`,
    `Interests: ${trip.interests.join(", ") || "not specified"}. Concerns: ${trip.concerns.join(", ") || "none given"}.`,
    trip.homeCity ? `Travelling from: ${trip.homeCity}.` : "",
    trip.notes ? `Traveller's own notes: "${trip.notes}"` : "",
    "",
  ];

  facts.forEach((f, i) => {
    const s = f.stop;
    const place = [s.name, s.admin, s.country].filter(Boolean).join(", ");
    lines.push(`=== STOP ${i + 1}: ${place} — ${s.startDate} to ${s.endDate} (${nightsBetween(s.startDate, s.endDate)} nights) ===`);

    const w = f.weather;
    if (w) {
      if (w.forecast.length) {
        lines.push(`WEATHER FORECAST (${w.forecast.length} day${w.forecast.length > 1 ? "s" : ""} available):`);
        for (const d of w.forecast) {
          lines.push(
            `  ${d.date}: ${describeSky(d.code).label}, ${fmtTemp(d.tMax)}/${fmtTemp(d.tMin)}, rain ${d.rainChance ?? "?"}% (${d.rainMm} mm)` +
              (d.uv != null ? `, UV ${Math.round(d.uv)}` : "") +
              (d.windKmh != null ? `, wind ${Math.round(d.windKmh)} km/h` : ""),
          );
        }
      } else {
        lines.push("WEATHER FORECAST: not available yet (trip is more than 16 days away) — use TYPICAL.");
      }
      if (w.tripTypical) {
        const t = w.tripTypical;
        lines.push(`TYPICAL FOR THESE DATES (${w.yearsUsed} average): high ${fmtTemp(t.tMax)}, low ${fmtTemp(t.tMin)}, rain on ${t.rainyDaysPct}% of days, ${t.rainMm} mm/day.`);
      }
      if (w.months.length) {
        lines.push(`BEST MONTHS (comfort score from real weather): ${w.bestMonths.map((m) => MONTH_NAMES[m - 1]).join(", ")}. Trip month ranks #${w.tripMonthRank} of 12.`);
        lines.push("MONTHLY (high/low, % rainy days): " + w.months.map((m) => `${MONTH_NAMES[m.month - 1]} ${Math.round(m.tMax)}/${Math.round(m.tMin)} ${m.rainyDaysPct}%`).join(" | "));
      }
    } else {
      lines.push("WEATHER: unavailable.");
    }

    if (f.advisory) {
      const a = f.advisory;
      lines.push(`SAFETY (UK Foreign Office advice for ${a.country}, updated ${a.updated.slice(0, 10)}). Alert flags: ${a.alerts.length ? a.alerts.join(", ") : "none"}.`);
      lines.push(shrink(a.summary, shrinkBy));
    } else {
      lines.push("SAFETY: official advice not available for this country.");
    }

    if (f.guide) {
      lines.push("TRAVEL GUIDE (Wikivoyage):");
      for (const [name, body] of Object.entries(f.guide.sections)) lines.push(`  [${name}] ${shrink(body, shrinkBy)}`);
    } else {
      lines.push("TRAVEL GUIDE: not found.");
    }

    if (f.news.length) {
      lines.push("NEWS (recent headlines):");
      for (const n of f.news) lines.push(`  [${n.id}] ${n.date.slice(0, 10)} · ${n.source} · ${n.title}`);
    } else {
      lines.push("NEWS: none found.");
    }
    if (f.problems.length) lines.push(`DATA GAPS: ${f.problems.join("; ")}`);
    lines.push("");
  });

  return lines.filter((l) => l !== undefined).join("\n");
}

export function buildMessages(trip: TripInput, facts: StopFacts[], today: string): ChatMessage[] {
  return [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `Write the briefing for this trip.\n\n${buildFactPack(trip, facts, today)}` },
  ];
}
