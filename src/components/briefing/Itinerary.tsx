/**
 * Itinerary: vertical timeline of stops with each country's FCDO advisory status.
 */
import { ArrowUpRight } from "lucide-react";
import type { Advisory, StopFacts } from "@/lib/types";
import { dateRange, nights } from "@/lib/format";
import { Section } from "./Section";

/** Maps FCDO alert codes to a short label and colour. */
export function advisoryStatus(a: Advisory | null): { text: string; tone: string } {
  if (!a) return { text: "No official advice found", tone: "text-muted border-line" };
  const alerts = a.alerts.join(" ");
  if (/avoid_all_travel_to_whole/.test(alerts)) return { text: "FCDO: avoid all travel", tone: "text-warn border-warn/40" };
  if (/avoid_all_travel_to_parts/.test(alerts)) return { text: "FCDO: avoid parts of country", tone: "text-warn border-warn/40" };
  if (/avoid_all_but_essential_travel_to_whole/.test(alerts)) return { text: "FCDO: essential travel only", tone: "text-warn border-warn/40" };
  if (/avoid_all_but_essential/.test(alerts)) return { text: "FCDO: some areas restricted", tone: "text-caution border-caution/40" };
  return { text: "No FCDO alerts", tone: "text-go border-go/40" };
}

export function Itinerary({ facts }: { facts: StopFacts[] }) {
  return (
    <Section eyebrow="Itinerary" title={`${facts.length} stop${facts.length > 1 ? "s" : ""}`}>
      <ol className="relative space-y-6">
        <span className="absolute bottom-3 left-[5px] top-3 w-px bg-line" aria-hidden />
        {facts.map((f, i) => {
          const s = f.stop;
          const status = advisoryStatus(f.advisory);
          return (
            <li key={i} className="relative pl-7">
              <span className={`absolute left-0 top-2.5 h-[11px] w-[11px] rounded-full border-2 ${i === 0 ? "border-forest bg-forest" : "border-forest bg-card"}`} />
              <div className="font-display text-[28px] leading-tight">{s.name}</div>
              <div className="text-[14px] text-muted">{[s.admin, s.country].filter(Boolean).join(", ")}</div>
              <div className="mt-2 font-mono text-[12px] text-ink-2">
                {dateRange(s.startDate, s.endDate)} · {nights(s.startDate, s.endDate)} nights
              </div>
              {f.advisory ? (
                <a href={f.advisory.url} target="_blank" rel="noreferrer" className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-wider ${status.tone} hover:bg-paper-2`}>
                  {status.text} <ArrowUpRight className="h-3 w-3" />
                </a>
              ) : (
                <span className={`mt-3 inline-flex rounded-full border px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-wider ${status.tone}`}>{status.text}</span>
              )}
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
