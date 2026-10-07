/**
 * Display formatting helpers. ISO dates are parsed as UTC noon so time zones
 * never shift the day.
 */
const d = (iso: string) => new Date(iso.slice(0, 10) + "T12:00:00Z");

/** "2026-10-12" → "12 Oct" */
export const dayMonth = (iso: string) =>
  d(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

/** "2026-10-12" → "Mon" */
export const weekday = (iso: string) => d(iso).toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" });

/** "2026-10-12", "2026-10-20" → "12–20 Oct 2026" (or "28 Oct – 3 Nov 2026") */
export function dateRange(a: string, b: string): string {
  const A = d(a), B = d(b);
  const year = B.getUTCFullYear();
  if (A.getUTCMonth() === B.getUTCMonth() && A.getUTCFullYear() === B.getUTCFullYear()) {
    return `${A.getUTCDate()}–${dayMonth(b)} ${year}`;
  }
  return `${dayMonth(a)} – ${dayMonth(b)} ${year}`;
}

export const nights = (a: string, b: string) => Math.max(0, Math.round((d(b).getTime() - d(a).getTime()) / 86_400_000));

/** ISO timestamp → "4 Oct 2026, 23:10" in the viewer's own time zone. */
export const stamp = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** Relative time: "3 h ago", "2 d ago". */
export function ago(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (!Number.isFinite(mins) || mins < 0) return "";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 48 * 60) return `${Math.round(mins / 60)} h ago`;
  return `${Math.round(mins / 1440)} d ago`;
}

export const temp = (n: number | null | undefined) => (n == null || !Number.isFinite(n) ? "–" : `${Math.round(n)}°`);

/** "family-visit" → "Family visit" */
export const label = (s: string) => (s.charAt(0).toUpperCase() + s.slice(1)).replace(/-/g, " ");
