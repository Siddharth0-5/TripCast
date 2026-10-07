/** Sample briefing integrity, fact pack construction and input validation. */
import { describe, it, expect } from "vitest";
import { SAMPLE_BRIEFING } from "@/lib/sample/sample-briefing";
import { buildFactPack, buildMessages } from "@/lib/ai/prompt";
import { TripInputSchema } from "@/lib/types";
import { advisoryStatus } from "@/components/briefing/Itinerary";

describe("sample briefing", () => {
  it("only refers to news IDs that really exist", () => {
    const ids = new Set(SAMPLE_BRIEFING.facts.flatMap((f) => f.news.map((n) => n.id)));
    for (const p of SAMPLE_BRIEFING.ai.news.picks) expect(ids.has(p.id)).toBe(true);
  });
  it("is a valid trip according to the questionnaire rules", () => {
    expect(TripInputSchema.safeParse(SAMPLE_BRIEFING.trip).success).toBe(true);
  });
});

describe("fact pack", () => {
  const pack = buildFactPack(SAMPLE_BRIEFING.trip, SAMPLE_BRIEFING.facts, "2026-10-04");

  it("includes every stop, the weather, safety and numbered news", () => {
    expect(pack).toContain("=== STOP 1: Lisbon");
    expect(pack).toContain("=== STOP 2: Porto");
    expect(pack).toContain("WEATHER FORECAST");
    expect(pack).toContain("BEST MONTHS");
    expect(pack).toContain("SAFETY (UK Foreign Office");
    expect(pack).toMatch(/\[N1\]/);
  });
  it("stays within a reasonable prompt size", () => {
    expect(pack.length).toBeLessThan(20_000);
  });
  it("sends a system message with the rules, then the facts", () => {
    const [system, user] = buildMessages(SAMPLE_BRIEFING.trip, SAMPLE_BRIEFING.facts, "2026-10-04");
    expect(system.role).toBe("system");
    expect(system.content).toContain("ONLY the FACT PACK");
    expect(user.content).toContain("TRAVELLER: couple");
  });
});

describe("questionnaire rules", () => {
  it("rejects a trip with no stops", () => {
    expect(TripInputSchema.safeParse({ ...SAMPLE_BRIEFING.trip, stops: [] }).success).toBe(false);
  });
  it("rejects a badly written date", () => {
    const stops = [{ ...SAMPLE_BRIEFING.trip.stops[0], startDate: "12/10/2026" }];
    expect(TripInputSchema.safeParse({ ...SAMPLE_BRIEFING.trip, stops }).success).toBe(false);
  });
});

describe("safety badge", () => {
  it("turns FCDO alert codes into words", () => {
    const base = { country: "X", url: "", updated: "", summary: "" };
    expect(advisoryStatus({ ...base, alerts: [] }).text).toBe("No FCDO alerts");
    expect(advisoryStatus({ ...base, alerts: ["avoid_all_travel_to_parts"] }).text).toBe("FCDO: avoid parts of country");
    expect(advisoryStatus(null).text).toBe("No official advice found");
  });
});
