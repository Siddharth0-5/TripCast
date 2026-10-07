/** Lenient JSON extraction and schema validation of model output. */
import { describe, it, expect } from "vitest";
import { extractJsonObject, parseAiReport } from "@/lib/ai/parse";
import { SAMPLE_BRIEFING } from "@/lib/sample/sample-briefing";

const good = JSON.stringify(SAMPLE_BRIEFING.ai);

describe("extractJsonObject", () => {
  it("finds JSON inside ```json fences and chatter", () => {
    const raw = "Sure! Here is your briefing:\n```json\n" + good + "\n```\nHave a great trip!";
    expect(JSON.parse(extractJsonObject(raw)!)).toEqual(SAMPLE_BRIEFING.ai);
  });
  it("is not fooled by braces inside strings", () => {
    expect(extractJsonObject('{"a": "a } inside", "b": 1}')).toBe('{"a": "a } inside", "b": 1}');
  });
  it("returns null when the answer was cut off", () => {
    expect(extractJsonObject('{"verdict": {"score": 7')).toBeNull();
  });
});

describe("parseAiReport", () => {
  it("accepts a good answer", () => {
    expect(parseAiReport(good).ok).toBe(true);
  });
  it("repairs trailing commas", () => {
    const messy = good.replace(/\]\}$/, "],}").replace('"tips":[', '"tips":[ ').replace(/"\}\]/, '"},]');
    expect(parseAiReport(messy).ok).toBe(true);
  });
  it("clamps an out-of-range score and fixes a wrong severity", () => {
    const data = JSON.parse(good);
    data.verdict.score = 42;
    data.headsUp[0].severity = "EXTREME";
    const r = parseAiReport(JSON.stringify(data));
    expect(r.ok && r.report.verdict.score).toBe(10);
    expect(r.ok && r.report.headsUp[0].severity).toBe("info");
  });
  it("drops broken list items but keeps the good ones", () => {
    const data = JSON.parse(good);
    data.todo.push({ nonsense: true });
    const r = parseAiReport(JSON.stringify(data));
    expect(r.ok && r.report.todo.length).toBe(SAMPLE_BRIEFING.ai.todo.length);
  });
  it("rejects an answer with no verdict", () => {
    expect(parseAiReport('{"headsUp": []}').ok).toBe(false);
  });
  it("rejects a nearly empty answer", () => {
    const r = parseAiReport('{"verdict": {"score": 7, "label": "Ok", "summary": "Fine.", "factors": []}}');
    expect(r.ok).toBe(false);
  });
  it("accepts but flags an answer whose later sections are empty", () => {
    const data = JSON.parse(good);
    data.news = { mood: "unknown", summary: "", picks: [] };
    data.tips = [];
    const r = parseAiReport(JSON.stringify(data));
    expect(r.ok && r.missing).toEqual(["news", "tips"]);
    expect(parseAiReport(good).ok && (parseAiReport(good) as { missing: string[] }).missing).toEqual([]);
  });
});
