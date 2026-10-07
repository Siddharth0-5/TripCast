/**
 * HeadsUp: notable items, sorted by severity.
 */
import type { AiReport } from "@/lib/types";
import { Section, TONE } from "./Section";
import { clean } from "./Verdict";

const ORDER = { warning: 0, caution: 1, info: 2 } as const;

export function HeadsUp({ items }: { items: AiReport["headsUp"] }) {
  const sorted = [...items].sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);
  return (
    <Section eyebrow="Heads-up" title="Worth knowing before you go">
      <ul className="divide-y divide-line border-t border-line">
        {sorted.map((h, i) => (
          <li key={i} className="grid grid-cols-[18px_1fr] gap-3 py-4">
            <span className={`mt-[7px] h-2 w-2 rounded-full ${TONE[h.severity]}`} aria-label={h.severity} />
            <div>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-[16px] font-medium">{h.title}</span>
                {h.stop && <span className="font-mono text-[10.5px] uppercase tracking-wider text-muted">{h.stop}</span>}
              </div>
              <p className="mt-1 text-[14.5px] leading-relaxed text-ink-2">{clean(h.detail)}</p>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
