/** Offline parsing and text-cleaning tests for the data sources. */
import { describe, it, expect } from "vitest";
import { parseGoogleRss, splitGoogleTitle } from "@/lib/sources/news";
import { splitMainSections, splitSections } from "@/lib/sources/guide";
import { stripBoilerplate } from "@/lib/sources/advisory";
import { htmlToText, clip } from "@/lib/http";
import { clean } from "@/components/briefing/Verdict";

describe("Google News", () => {
  const xml = `<?xml version="1.0"?><rss><channel>
    <item><title>Metro strike shuts Lisbon lines on Friday - Portugal Resident</title><link>https://news.google.com/a</link><pubDate>Sat, 03 Oct 2026 10:00:00 GMT</pubDate><source url="https://x">Portugal Resident</source></item>
    <item><title>Lisbon after dark - site.com - site.com</title><link>https://news.google.com/b</link><pubDate>bad date</pubDate></item>
  </channel></rss>`;

  it("reads headline, source, link and date", () => {
    const items = parseGoogleRss(xml, "Lisbon");
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ title: "Metro strike shuts Lisbon lines on Friday", source: "Portugal Resident", url: "https://news.google.com/a", stop: "Lisbon" });
    expect(items[0].date.startsWith("2026-10-03")).toBe(true);
    expect(items[1].date).toBe("");
  });
  it("removes a repeated site name from titles", () => {
    expect(splitGoogleTitle("Lisbon after dark - site.com - site.com", "x").title).toBe("Lisbon after dark");
  });
});

describe("Wikivoyage sections", () => {
  it("splits plain text at == headings ==", () => {
    const text = "Intro text.\n== Understand ==\nAbout it.\n=== Climate ===\nWarm.\n== Stay safe ==\nWatch bags.";
    expect(splitSections(text)).toEqual({ Intro: "Intro text.", Understand: "About it.", Climate: "Warm.", "Stay safe": "Watch bags." });
  });
  it("keeps a main section's sub-sections (where the real names usually are)", () => {
    const text = "Intro.\n== Do ==\nLots.\n=== Public baths ===\nVisit Funaoka Onsen for a classic soak.\n=== Festivals ===\nGion Matsuri fills July with floats.\n== Eat ==\nKaiseki is the local haute cuisine of many courses.";
    const out = splitMainSections(text, { Do: 1000, Eat: 1000 });
    expect(out.Do).toBe("Public baths: Visit Funaoka Onsen for a classic soak. Festivals: Gion Matsuri fills July with floats.");
    expect(out.Eat).toBe("Kaiseki is the local haute cuisine of many courses.");
  });
});

describe("text cleaning", () => {
  it("turns HTML into plain text", () => {
    expect(htmlToText("<p>Hello&nbsp;<b>world</b> &amp; friends</p>")).toBe("Hello world & friends");
  });
  it("clips long text on a word boundary", () => {
    expect(clip("one two three four five", 12)).toBe("one two…");
  });
  it("removes generic FCDO sentences", () => {
    const t = "There is a high threat of terrorist attack globally affecting UK interests and British nationals.\nStrikes happen at airports.";
    expect(stripBoilerplate(t)).toBe("Strikes happen at airports.");
  });
  it("removes (N3) news references from AI text", () => {
    expect(clean("A strike cancelled flights (N6). Check your airline.")).toBe("A strike cancelled flights. Check your airline.");
    expect(clean("See N2, N3 for details")).toBe("See for details");
  });
});
