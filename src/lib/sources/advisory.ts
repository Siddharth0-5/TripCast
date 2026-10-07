/**
 * UK FCDO travel advice via the GOV.UK Content API: alert flags plus a short
 * summary of the warnings and safety sections for a country.
 */
import { fetchJson, htmlToText, clip } from "../http";
import { remember, HOUR } from "../cache";
import type { Advisory } from "../types";

type IndexDoc = {
  links?: { children?: Array<{ base_path: string; details?: { country?: { name?: string } } }> };
};
type CountryDoc = {
  title?: string;
  public_updated_at?: string;
  details?: {
    alert_status?: string[];
    updated_at?: string;
    parts?: Array<{ slug: string; title: string; body: string }>;
  };
};

// Names that differ between the geocoder and GOV.UK.
const ALIASES: Record<string, string> = {
  "united states": "usa",
  "united states of america": "usa",
  czechia: "czech republic",
  "türkiye": "turkey",
  "south korea": "south korea",
  "republic of korea": "south korea",
  "côte d'ivoire": "ivory coast",
  "myanmar": "burma",
};

/** Removes boilerplate sentences that appear on every country page. */
export function stripBoilerplate(text: string): string {
  return text
    .replace(/There is a high threat of terrorist attack globally[^\n]*?(\.|\n)/g, "")
    .replace(/Stay aware of your surroundings at all times[^\n]*?(\.|\n)/g, "")
    .replace(/UK Counter Terrorism Policing[^\n]*?(\.|\n)/g, "")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .trim();
}

const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

async function countryIndex(): Promise<Map<string, string>> {
  return remember("fcdo:index", 24 * HOUR, async () => {
    const data = await fetchJson<IndexDoc>("https://www.gov.uk/api/content/foreign-travel-advice");
    const map = new Map<string, string>();
    for (const c of data.links?.children ?? []) {
      const name = c.details?.country?.name;
      if (name) map.set(normalize(name), c.base_path);
    }
    return map;
  });
}

export async function getAdvisory(country: string): Promise<Advisory | null> {
  if (!country) return null;
  const index = await countryIndex();
  const key = normalize(country);
  const path = index.get(key) ?? index.get(normalize(ALIASES[key] ?? ""));
  if (!path) return null; // e.g. the UK itself

  return remember(`fcdo:${path}`, 6 * HOUR, async () => {
    const doc = await fetchJson<CountryDoc>(`https://www.gov.uk/api/content${path}`);
    const parts = doc.details?.parts ?? [];
    const pick = (slug: string, max: number) => {
      const p = parts.find((x) => x.slug === slug);
      return p ? `${p.title}: ${clip(stripBoilerplate(htmlToText(p.body)), max)}` : "";
    };
    // The first part holds the headline warnings, followed by generic
    // "Before you travel" text shared by every country.
    const first = parts[0] ? stripBoilerplate(htmlToText(parts[0].body).split(/\n\s*Before you travel/)[0]) : "";
    const summary = [
      first ? `${parts[0].title}: ${clip(first, 1100)}` : "",
      pick("safety-and-security", 1200),
    ].filter(Boolean).join("\n\n");

    return {
      country,
      url: `https://www.gov.uk${path}`,
      alerts: doc.details?.alert_status ?? [],
      updated: doc.public_updated_at ?? doc.details?.updated_at ?? "",
      summary,
    };
  });
}
