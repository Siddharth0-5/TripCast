/** Live integration tests against the real data sources (network required). Run: npm run check:live */
import { describe, it, expect } from "vitest";
import { searchPlaces } from "@/lib/sources/places";
import { getStopWeather, todayIso, addDays } from "@/lib/sources/weather";
import { getStopNews } from "@/lib/sources/news";
import { getStopGuide } from "@/lib/sources/guide";
import { getAdvisory } from "@/lib/sources/advisory";
import { gatherFacts } from "@/lib/briefing";
import { buildFactPack } from "@/lib/ai/prompt";
import type { Stop, TripInput } from "@/lib/types";

async function lisbon(startInDays: number, nights: number): Promise<Stop> {
  const [p] = await searchPlaces("Lisbon");
  const start = addDays(todayIso(), startInDays);
  return { ...p, startDate: start, endDate: addDays(start, nights) };
}

describe("live data sources", () => {
  it("finds places", async () => {
    const places = await searchPlaces("Lisbon");
    expect(places[0].country).toBe("Portugal");
  });

  it("gets a forecast for a trip next week", async () => {
    const w = await getStopWeather(await lisbon(5, 4));
    expect(w.mode).toBe("forecast");
    expect(w.forecast.length).toBeGreaterThan(2);
    expect(w.months.length).toBe(12);
  });

  it("uses typical weather for a trip months away", async () => {
    const w = await getStopWeather(await lisbon(120, 5));
    expect(w.mode).toBe("climate");
    expect(w.tripTypical?.tMax).toBeTypeOf("number");
    expect(w.bestMonths.length).toBe(3);
  });

  it("gets news, guide and safety advice", async () => {
    const stop = await lisbon(5, 4);
    const [news, guide, advisory] = await Promise.all([getStopNews(stop), getStopGuide(stop), getAdvisory(stop.country)]);
    expect(news.length).toBeGreaterThan(0);
    expect(guide && Object.keys(guide.sections)).toContain("Stay safe");
    expect(advisory?.url).toContain("gov.uk");
  });

  it("builds a full fact pack", async () => {
    const trip: TripInput = {
      stops: [await lisbon(5, 4)],
      homeCity: "Mumbai", group: "couple", withKids: false, withSeniors: false,
      purpose: "leisure", pace: "balanced", budget: "comfortable",
      interests: ["food", "history"], concerns: ["heat"], notes: "",
    };
    const facts = await gatherFacts(trip);
    const pack = buildFactPack(trip, facts, todayIso());
    console.log(pack.slice(0, 2500), `\n… (${pack.length} characters total)`);
    expect(facts[0].problems).toEqual([]);
    expect(pack).toContain("[N1]");
  });
});
