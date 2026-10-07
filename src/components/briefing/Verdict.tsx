/**
 * Verdict: go-score card with summary and the four scoring factors.
 */
import { CloudSun, ShieldCheck, Newspaper, CalendarRange } from "lucide-react";
import type { AiReport } from "@/lib/types";
import { TONE } from "./Section";

const ICON = { weather: CloudSun, safety: ShieldCheck, news: Newspaper, season: CalendarRange };

/** Strips "(N3)"-style news references from generated text; links are rendered separately. */
export const clean = (s: string) => s.replace(/\s*\(?\b(N\d+)(,\s*N\d+)*\)?(?=[\s.,;:]|$)/g, "").trim();

export function Verdict({ verdict }: { verdict: AiReport["verdict"] }) {
  const tone = verdict.score >= 7 ? "text-mint" : verdict.score >= 5 ? "text-[#f2d49b]" : "text-[#f3b2a2]";
  return (
    <section className="relative overflow-hidden rounded-[22px] bg-ink p-7 text-paper sm:p-9">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="eyebrow !text-paper/50">Go-score</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-[112px] leading-[0.8] sm:text-[136px]">{verdict.score}</span>
            <span className="font-display text-[32px] text-paper/40">/10</span>
          </div>
          <p className={`mt-5 font-display text-[34px] leading-tight ${tone}`}>{verdict.label}</p>
          <p className="mt-4 max-w-[46ch] text-[16px] leading-relaxed text-paper/75">{clean(verdict.summary)}</p>
        </div>
        <ul className="self-end border-t border-paper/12">
          {verdict.factors.map((f) => {
            const Icon = ICON[f.factor];
            return (
              <li key={f.factor} className="grid grid-cols-[28px_1fr] gap-3 border-b border-paper/12 py-4">
                <Icon className="mt-0.5 h-[18px] w-[18px] text-paper/60" strokeWidth={1.5} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-medium capitalize">{f.factor}</span>
                    <span className={`h-1.5 w-1.5 rounded-full ${TONE[f.impact]}`} aria-label={f.impact} />
                  </div>
                  <p className="mt-1 text-[14px] leading-relaxed text-paper/65">{clean(f.text)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
