/**
 * Alternatives: better months (from climate data) and similar destinations.
 */
import type { AiReport, StopFacts } from "@/lib/types";
import { MONTH_NAMES } from "@/lib/climate";
import { Section } from "./Section";
import { clean } from "./Verdict";

export function Alternatives({ alt, facts }: { alt: AiReport["alternatives"]; facts: StopFacts[] }) {
  return (
    <Section eyebrow="Alternatives" title="Other times, other places">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <p className="text-[15px] leading-relaxed text-ink-2">{clean(alt.timing)}</p>
          <ul className="mt-5 space-y-2">
            {facts.map((f) =>
              f.weather?.bestMonths.length ? (
                <li key={f.stop.name} className="flex flex-wrap items-center gap-2 text-[14px]">
                  <span className="w-24 shrink-0 font-medium">{f.stop.name}</span>
                  {f.weather.bestMonths.map((m) => (
                    <span key={m} className="rounded-full bg-mint px-2.5 py-0.5 font-mono text-[11px] text-forest">{MONTH_NAMES[m - 1]}</span>
                  ))}
                </li>
              ) : null,
            )}
          </ul>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {alt.destinations.map((d, i) => (
            <article key={i} className="rounded-[18px] border border-line bg-paper/50 p-5">
              <h3 className="font-display text-[26px] leading-tight">{d.name}</h3>
              {d.country && <p className="font-mono text-[11px] uppercase tracking-wider text-muted">{d.country}</p>}
              <p className="mt-3 text-[14px] leading-relaxed text-ink-2">{clean(d.why)}</p>
            </article>
          ))}
        </div>
      </div>
    </Section>
  );
}
