/**
 * Checks that every temperature and percentage in the model's report appears
 * in the fact pack (±1 for rounding). Unmatched numbers are reported as
 * unsupported and trigger a retry.
 */
import type { AiReport } from "../types";

/** All free-text fields of the report. */
function allText(r: AiReport): string[] {
  return [
    r.verdict.summary,
    ...r.verdict.factors.map((f) => f.text),
    ...r.headsUp.flatMap((h) => [h.title, h.detail]),
    ...r.todo.flatMap((t) => [t.title, t.detail, t.bestWhen ?? ""]),
    ...r.packing.flatMap((g) => g.items.flatMap((i) => [i.item, i.why])),
    r.news.summary,
    ...r.news.picks.map((p) => p.takeaway),
    ...r.tips.flatMap((t) => [t.title, t.detail]),
    r.alternatives.timing,
    ...r.alternatives.destinations.map((d) => d.why),
  ];
}

/** Temperatures and percentages present in the fact pack. */
function knownNumbers(factPack: string) {
  const temps = new Set<number>();
  const pcts = new Set<number>();
  for (const m of factPack.matchAll(/(-?\d+)°C/g)) temps.add(Number(m[1]));
  // MONTHLY lines use "Oct 20/13 30%" (high/low without °C).
  for (const m of factPack.matchAll(/ (-?\d+)\/(-?\d+) \d+%/g)) temps.add(Number(m[1])).add(Number(m[2]));
  for (const m of factPack.matchAll(/(\d+)%/g)) pcts.add(Number(m[1]));
  return { temps, pcts };
}

const near = (set: Set<number>, n: number, slack: number) => [...set].some((k) => Math.abs(k - n) <= slack);

/** Returns numbers in the report not found in the fact pack, e.g. ["25°C", "45%"]. */
export function unsupportedNumbers(report: AiReport, factPack: string): string[] {
  const { temps, pcts } = knownNumbers(factPack);
  const bad = new Set<string>();
  // Matches "20°C", "20 °C", "20°", "30%", and ranges like "16–36%" or "13 to 20°C".
  const pattern = /(-?\d+(?:\.\d+)?)(?:\s*(?:-|–|‑|to)\s*(\d+(?:\.\d+)?))?\s*(°\s*C?|%)/g;
  for (const text of allText(report)) {
    for (const m of text.matchAll(pattern)) {
      const isTemp = m[3].startsWith("°");
      for (const raw of [m[1], m[2]]) {
        if (raw === undefined) continue;
        const n = Math.round(Number(raw));
        const ok = isTemp ? near(temps, n, 1) : near(pcts, n, 1);
        if (!ok) bad.add(`${raw}${isTemp ? "°C" : "%"}`);
      }
    }
  }
  return [...bad];
}
