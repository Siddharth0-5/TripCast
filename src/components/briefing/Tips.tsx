/**
 * Tips: local customs, transport, money and etiquette.
 */
import type { AiReport } from "@/lib/types";
import { Section } from "./Section";
import { clean } from "./Verdict";

export function Tips({ tips }: { tips: AiReport["tips"] }) {
  return (
    <Section eyebrow="Local know-how" title="Good to know">
      <ol className="space-y-5">
        {tips.map((t, i) => (
          <li key={i} className="grid grid-cols-[28px_1fr] gap-2">
            <span className="font-mono text-[12px] leading-6 text-muted">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <div className="text-[15.5px] font-medium">{t.title}</div>
              <p className="mt-1 text-[14px] leading-relaxed text-ink-2">{clean(t.detail)}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
