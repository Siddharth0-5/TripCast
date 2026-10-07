/**
 * Recent headlines for a stop from Google News RSS, plus The Guardian when
 * GUARDIAN_API_KEY is set. Only title, source, date and link are kept.
 */
import { XMLParser } from "fast-xml-parser";
import { fetchJson, fetchText } from "../http";
import { remember, HOUR } from "../cache";
import type { NewsItem, Stop } from "../types";

const PER_STOP = 7;

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

type RssItem = {
  title?: string;
  link?: string;
  pubDate?: string;
  source?: string | { "#text"?: string; "@_url"?: string };
};

/** Splits Google's "Headline - Source" titles. */
export function splitGoogleTitle(raw: string, fallbackSource: string): { title: string; source: string } {
  const i = raw.lastIndexOf(" - ");
  if (i < 15) return { title: raw.trim(), source: fallbackSource };
  const source = raw.slice(i + 3).trim();
  let title = raw.slice(0, i).trim();
  // Some titles repeat the source: "Headline - site.com - site.com".
  if (title.endsWith(` - ${source}`)) title = title.slice(0, -(source.length + 3)).trim();
  return { title, source };
}

export function parseGoogleRss(xml: string, stopName: string): NewsItem[] {
  const doc = parser.parse(xml);
  const raw = doc?.rss?.channel?.item;
  const items: RssItem[] = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return items.flatMap((it) => {
    if (!it.title || !it.link) return [];
    const srcName = typeof it.source === "string" ? it.source : it.source?.["#text"] ?? "Google News";
    const { title, source } = splitGoogleTitle(String(it.title), srcName);
    const date = it.pubDate ? new Date(it.pubDate) : null;
    return [{
      id: "",
      title,
      source,
      url: String(it.link),
      date: date && !isNaN(date.getTime()) ? date.toISOString() : "",
      stop: stopName,
    }];
  });
}

async function googleNews(query: string, stopName: string): Promise<NewsItem[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  return parseGoogleRss(await fetchText(url), stopName);
}

async function guardianNews(stop: Stop, key: string): Promise<NewsItem[]> {
  const from = new Date(Date.now() - 30 * 24 * HOUR).toISOString().slice(0, 10);
  const params = new URLSearchParams({
    q: `"${stop.name}"`,
    "from-date": from,
    "order-by": "newest",
    "page-size": "6",
    "api-key": key,
  });
  type G = { response?: { results?: Array<{ webTitle: string; webUrl: string; webPublicationDate: string }> } };
  const data = await fetchJson<G>(`https://content.guardianapis.com/search?${params}`);
  return (data.response?.results ?? []).map((r) => ({
    id: "",
    title: r.webTitle,
    source: "The Guardian",
    url: r.webUrl,
    date: r.webPublicationDate,
    stop: stop.name,
  }));
}

export async function getStopNews(stop: Stop): Promise<NewsItem[]> {
  return remember(`news:${stop.name}:${stop.country}`, 3 * HOUR, async () => {
    const place = `"${stop.name}"`;
    // Many city names are also football clubs (Porto, Madrid…), so sport terms are excluded.
    const noSport = "-football -soccer -league -striker -transfer -match -goal";
    const travelWords = "(travel OR tourists OR tourism OR strike OR protest OR flood OR storm OR wildfire OR festival OR closure OR airport)";
    const cityWords = "(city OR residents OR transport OR metro OR weather OR mayor OR police OR prices)";
    const guardianKey = process.env.GUARDIAN_API_KEY?.trim();

    const results = await Promise.allSettled([
      googleNews(`${place} ${travelWords} ${noSport} when:30d`, stop.name),
      googleNews(`${place} ${cityWords} ${noSport} when:14d`, stop.name),
      guardianKey ? guardianNews(stop, guardianKey) : Promise.resolve([]),
    ]);
    const all = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
    if (results.every((r) => r.status === "rejected")) throw new Error("all news searches failed");

    // De-duplicate across searches, newest first.
    const seen = new Set<string>();
    return all
      .filter((n) => {
        const k = n.title.toLowerCase().slice(0, 60);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .sort((a, b) => (b.date > a.date ? 1 : -1))
      .slice(0, PER_STOP);
  });
}
