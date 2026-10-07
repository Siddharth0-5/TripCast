/**
 * Wikivoyage article (plain-text extract) for a stop, reduced to the sections
 * that are useful for a briefing, each capped in length. Real place names here
 * keep the model from filling gaps from memory.
 */
import { fetchJson, clip } from "../http";
import { remember, HOUR } from "../cache";
import type { Stop } from "../types";

// Section → character budget. Sub-sections are included and share the budget.
const WANTED: Record<string, number> = {
  Understand: 500,
  Climate: 700,
  "Get around": 500,
  See: 1100,
  Do: 1100,
  Eat: 800,
  "Stay safe": 700,
  "Stay healthy": 300,
  Respect: 500,
  Cope: 200,
  "Go next": 600, // nearby places, used for alternative destinations
};

/** Splits plain-text extract on "== Heading ==" markers (levels 2–4). */
export function splitSections(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  const parts = text.split(/\n(={2,4}) ([^=\n]+?) \1\n/);
  // [intro, "==", title, body, "==", title, body, ...]
  out.Intro = parts[0] ?? "";
  for (let i = 1; i < parts.length; i += 3) {
    const title = (parts[i + 1] ?? "").trim();
    const body = (parts[i + 2] ?? "").trim();
    if (title && !(title in out)) out[title] = body;
  }
  return out;
}

/**
 * Groups each level-2 section with its sub-sections and splits the section's
 * budget evenly between them, so one long sub-section can't crowd out the rest.
 *   "== Eat ==\nIntro\n=== Matcha ===\nGreen tea…"  →  { Eat: "Intro Matcha: Green tea…" }
 */
export function splitMainSections(text: string, budget: Record<string, number>): Record<string, string> {
  const out: Record<string, string> = {};
  const parts = text.split(/\n(={2,4}) ([^=\n]+?) \1\n/);
  type Part = { title: string; body: string };
  const groups: Record<string, Part[]> = {};
  let current: string | null = null;
  for (let i = 1; i < parts.length; i += 3) {
    const level = parts[i].length;
    const title = (parts[i + 1] ?? "").trim();
    const body = (parts[i + 2] ?? "").replace(/\s+/g, " ").trim();
    if (level === 2) current = title in groups ? null : title; // first occurrence wins
    if (current === null) continue;
    if (level > 2 && title in budget) continue; // e.g. "Climate" under "Understand" is kept separately
    (groups[current] ??= []).push({ title: level === 2 ? "" : title, body });
  }
  for (const [name, items] of Object.entries(groups)) {
    const max = budget[name];
    if (!max) continue;
    const filled = items.filter((p) => p.body.length > 20);
    const share = Math.max(150, Math.floor(max / Math.max(1, filled.length)));
    const joined = filled.map((p) => (p.title ? `${p.title}: ` : "") + clip(p.body, share)).join(" ");
    if (joined.length > 40) out[name] = clip(joined, max);
  }
  return out;
}

type Extract = { query?: { pages?: Record<string, { title?: string; extract?: string; missing?: string }> } };

async function fetchArticle(title: string) {
  const params = new URLSearchParams({
    action: "query",
    prop: "extracts",
    explaintext: "1",
    redirects: "1",
    titles: title,
    format: "json",
  });
  const data = await fetchJson<Extract>(`https://en.wikivoyage.org/w/api.php?${params}`);
  const page = Object.values(data.query?.pages ?? {})[0];
  if (!page || "missing" in page || !page.extract) return null;
  return { title: page.title ?? title, text: page.extract };
}

export async function getStopGuide(stop: Stop) {
  return remember(`guide:${stop.name}:${stop.country}`, 24 * HOUR, async () => {
    // Fall back to "Name (Region)" / "Name (Country)" for missing or disambiguation pages.
    let article = await fetchArticle(stop.name);
    const looksAmbiguous = article && /may refer to|can refer to/i.test(article.text.slice(0, 400));
    if ((!article || looksAmbiguous) && stop.admin) article = await fetchArticle(`${stop.name} (${stop.admin})`);
    if ((!article || looksAmbiguous) && stop.country) article = (await fetchArticle(`${stop.name} (${stop.country})`)) ?? article;
    if (!article) return null;

    const all = splitSections(article.text);
    const main = splitMainSections(article.text, WANTED);
    const sections: Record<string, string> = {};
    for (const [name, max] of Object.entries(WANTED)) {
      // "Climate" is usually a sub-section, so fall back to the flat split.
      const body = main[name] ?? all[name];
      if (body && body.length > 40) sections[name] = clip(body.replace(/\s+/g, " "), max);
    }
    if (!Object.keys(sections).length && all.Intro) sections.Overview = clip(all.Intro, 700);
    return {
      url: `https://en.wikivoyage.org/wiki/${encodeURIComponent(article.title.replace(/ /g, "_"))}`,
      sections,
    };
  });
}
