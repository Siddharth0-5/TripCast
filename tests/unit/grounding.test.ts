/** Number grounding check against the fact pack. */
import { describe, it, expect } from "vitest";
import { unsupportedNumbers } from "@/lib/ai/grounding";
import { SAMPLE_BRIEFING } from "@/lib/sample/sample-briefing";
import type { AiReport } from "@/lib/types";

const pack = [
  "  2026-10-18: Light rain, 21°C/14°C, rain 36% (2.1 mm)",
  "  2026-10-19: Clear, 23°C/13°C, rain 5% (0 mm)",
  "TYPICAL FOR THESE DATES (5-year average): high 20°C, low 13°C, rain on 30% of days, 3.1 mm/day.",
  "MONTHLY (high/low, % rainy days): Jan 9/1 20% | Oct 20/13 30%",
].join("\n");

function report(summary: string): AiReport {
  const r = structuredClone(SAMPLE_BRIEFING.ai) as AiReport;
  r.verdict.summary = summary;
  // Clear the rest so only `summary` is being tested.
  r.verdict.factors = []; r.headsUp = []; r.todo = []; r.packing = []; r.tips = [];
  r.news = { mood: "unknown", summary: "", picks: [] };
  r.alternatives = { destinations: [], timing: "" };
  return r;
}

describe("unsupportedNumbers", () => {
  it("accepts numbers copied from the facts (and small rounding)", () => {
    expect(unsupportedNumbers(report("Highs around 22°C, lows 13 °C, rain 5–36% and on 30% of days. January is 9°."), pack)).toEqual([]);
  });
  it("flags temperatures and percentages that aren't in the facts", () => {
    expect(unsupportedNumbers(report("Expect 28°C and a 60% chance of storms."), pack)).toEqual(["28°C", "60%"]);
  });
  it("checks both ends of a range", () => {
    expect(unsupportedNumbers(report("Rain chance 5–80%."), pack)).toEqual(["80%"]);
  });
  it("ignores numbers without °/% (dates, sizes, prices)", () => {
    expect(unsupportedNumbers(report("Bring a 25 L daypack and ¥5,000 on Oct 18."), pack)).toEqual([]);
  });
});

describe("the built-in sample", () => {
  it("passes the number check against its own facts (no false alarms)", async () => {
    const { buildFactPack } = await import("@/lib/ai/prompt");
    const pack = buildFactPack(SAMPLE_BRIEFING.trip, SAMPLE_BRIEFING.facts, SAMPLE_BRIEFING.createdAt.slice(0, 10));
    expect(unsupportedNumbers(SAMPLE_BRIEFING.ai, pack)).toEqual([]);
  });
});
