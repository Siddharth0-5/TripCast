/** End-to-end buildBriefing flow with mocked sources and model: retry, success, cache, failure. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SAMPLE_BRIEFING } from "@/lib/sample/sample-briefing";

const S = SAMPLE_BRIEFING;
const factFor = (name: string) => S.facts.find((f) => f.stop.name === name)!;

vi.mock("@/lib/sources/weather", async (orig) => ({
  ...(await orig<typeof import("@/lib/sources/weather")>()),
  getStopWeather: async (stop: { name: string }) => factFor(stop.name).weather,
}));
vi.mock("@/lib/sources/news", () => ({ getStopNews: async (stop: { name: string }) => structuredClone(factFor(stop.name).news) }));
vi.mock("@/lib/sources/guide", () => ({ getStopGuide: async (stop: { name: string }) => factFor(stop.name).guide }));
vi.mock("@/lib/sources/advisory", () => ({ getAdvisory: async () => { throw new Error("GOV.UK is down"); } }));
vi.mock("@/lib/ai/models", () => ({ chooseModels: () => ["model-a", "model-b", "model-c"] }));

const chat = vi.fn();
vi.mock("@/lib/ai/gemini", async (orig) => ({
  ...(await orig<typeof import("@/lib/ai/gemini")>()),
  chat: (...args: unknown[]) => chat(...args),
}));

const { buildBriefing } = await import("@/lib/briefing");

describe("buildBriefing", () => {
  beforeEach(() => chat.mockReset());

  it("retries once with the next model after a messy answer, then succeeds", async () => {
    chat
      .mockResolvedValueOnce({ text: "Sorry, I can't format that.", model: "model-a" })
      .mockResolvedValueOnce({ text: "```json\n" + JSON.stringify(S.ai) + "\n```", model: "model-b" });

    const steps: string[] = [];
    const { briefing, cached } = await buildBriefing(S.trip, (e) => steps.push(e.step));

    expect(cached).toBe(false);
    expect(chat).toHaveBeenCalledTimes(2);
    expect(chat.mock.calls[1][0].models[0]).toBe("model-b"); // second try starts with the next model
    expect(briefing.model).toBe("model-b");
    expect(briefing.ai.verdict.score).toBe(S.ai.verdict.score);
    expect(steps).toContain("writing");
    expect(steps).toContain("checking");
    // A failed source is recorded as a problem, not thrown.
    expect(briefing.facts[0].advisory).toBeNull();
    expect(briefing.facts[0].problems[0]).toMatch(/safety advice unavailable/);
  });

  it("answers the same trip again from the cache without calling the AI", async () => {
    const again = await buildBriefing(S.trip);
    expect(again.cached).toBe(true);
    expect(chat).not.toHaveBeenCalled();
  });

  it("gives up with a clear message after two bad answers", async () => {
    chat.mockResolvedValue({ text: "{}", model: "model-a" });
    const other = { ...S.trip, notes: "different trip" };
    await expect(buildBriefing(other)).rejects.toThrow(/didn't come out right/);
    expect(chat).toHaveBeenCalledTimes(2);
  });
});
