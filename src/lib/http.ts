/**
 * Fetch helpers shared by all data sources: timeout, User-Agent header
 * (requested by Wikimedia APIs) and readable error messages.
 */
const USER_AGENT = "Tripcast/1.0 (trip briefing app)";

export async function fetchText(url: string, init: RequestInit = {}, timeoutMs = 12_000): Promise<string> {
  const res = await fetch(url, {
    ...init,
    headers: { "User-Agent": USER_AGENT, ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    throw new Error(`${new URL(url).hostname} answered ${res.status} ${res.statusText}`);
  }
  return res.text();
}

export async function fetchJson<T = unknown>(url: string, init: RequestInit = {}, timeoutMs = 12_000): Promise<T> {
  const body = await fetchText(url, init, timeoutMs);
  return JSON.parse(body) as T;
}

/** Strips tags, decodes common entities and collapses whitespace. */
export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(p|div|h\d|li|br)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

/** Truncates to about `max` characters at a word boundary. */
export function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20)).trimEnd() + "…";
}
