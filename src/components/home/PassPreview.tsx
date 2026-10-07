/**
 * PassPreview: boarding-pass card for the landing hero, rendered from the
 * bundled sample briefing.
 */
import { SAMPLE_BRIEFING as B } from "@/lib/sample/sample-briefing";
import { SkyIcon } from "@/components/SkyIcon";
import { dateRange, temp, weekday } from "@/lib/format";
import { TriangleAlert } from "lucide-react";
import { CountUp } from "./CountUp";

export function PassPreview() {
  const [first, ...rest] = B.facts;
  const last = rest.at(-1) ?? first;
  const code = (s: string) => s.slice(0, 3).toUpperCase();
  const days = first.weather?.forecast.slice(0, 6) ?? [];
  const warning = B.ai.headsUp.find((h) => h.severity === "warning");

  return (
    <div className="relative mx-auto w-full max-w-[440px] animate-rise [animation-delay:150ms]">
      <div className="animate-float">
        <div className="relative -rotate-[1.5deg] overflow-hidden rounded-[26px] bg-ink text-paper shadow-[0_30px_80px_-30px_rgba(22,20,17,0.6)]">
          <div className="flex items-center justify-between px-7 pt-6">
            <span className="eyebrow !text-paper/50">Trip briefing</span>
            <span className="font-mono text-[11px] text-paper/50">{dateRange(first.stop.startDate, last.stop.endDate)}</span>
          </div>

          <div className="flex items-end justify-between px-7 pt-5">
            <div>
              <div className="font-mono text-[40px] font-medium leading-none tracking-tight">{code(first.stop.name)}</div>
              <div className="mt-1 text-[13px] text-paper/60">{first.stop.name}</div>
            </div>
            <div className="mb-5 flex flex-1 items-center gap-2 px-4 text-paper/40" aria-hidden>
              <span className="h-px flex-1 border-t border-dashed border-paper/30" />
              <span className="font-mono text-[11px]">✈</span>
              <span className="h-px flex-1 border-t border-dashed border-paper/30" />
            </div>
            <div className="text-right">
              <div className="font-mono text-[40px] font-medium leading-none tracking-tight">{code(last.stop.name)}</div>
              <div className="mt-1 text-[13px] text-paper/60">{last.stop.name}</div>
            </div>
          </div>

          {/* Perforation with side notches */}
          <div className="relative my-6 h-px">
            <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-paper" />
            <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-paper" />
            <span className="absolute inset-x-6 top-0 border-t border-dashed border-paper/20" />
          </div>

          <div className="flex items-end justify-between gap-6 px-7">
            <div>
              <div className="eyebrow !text-paper/50">Go-score</div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-display text-[76px] leading-[0.8] tabular-nums"><CountUp to={B.ai.verdict.score} /></span>
                <span className="font-display text-2xl text-paper/50">/10</span>
              </div>
            </div>
            <div className="pb-1 text-right">
              <div className="font-display text-[26px] leading-tight text-mint">{B.ai.verdict.label}</div>
              <div className="mt-1 text-[12px] text-paper/50">Weather · Safety · News · Season</div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-6 border-t border-paper/10 px-4 py-4">
            {days.map((d, i) => (
              <div key={d.date} className="flex animate-rise flex-col items-center gap-1.5" style={{ animationDelay: `${700 + i * 110}ms` }}>
                <span className="font-mono text-[10px] uppercase text-paper/45">{weekday(d.date)}</span>
                <SkyIcon code={d.code} className="h-5 w-5 text-paper/85" />
                <span className="font-mono text-[12px]">{temp(d.tMax)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top warning, tucked under the ticket */}
        {warning && (
          <div className="card relative -mt-3 ml-8 mr-[-8px] rotate-[1.2deg] p-5 shadow-[0_20px_50px_-30px_rgba(22,20,17,0.45)]">
            <div className="flex items-start gap-3">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warn" strokeWidth={1.75} />
              <div>
                <div className="text-[14px] font-medium">{warning.title}</div>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{warning.detail.replace(/\s*\(N\d+\)/g, "")}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
