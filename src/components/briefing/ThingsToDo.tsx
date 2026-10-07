/**
 * ThingsToDo: suggestion cards tagged by category.
 */
import { Clock } from "lucide-react";
import type { AiReport } from "@/lib/types";
import { Section } from "./Section";
import { clean } from "./Verdict";

const KIND: Record<AiReport["todo"][number]["category"], string> = {
  see: "See",
  do: "Do",
  eat: "Eat",
  "book-ahead": "Book ahead",
  admin: "Admin",
};

export function ThingsToDo({ items }: { items: AiReport["todo"] }) {
  return (
    <Section eyebrow="Things to do" title="Made for your interests">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((t, i) => (
          <article key={i} className="flex flex-col rounded-[18px] border border-line bg-paper/50 p-5 transition-colors hover:border-ink-2">
            <div className="flex items-center justify-between">
              <span className={`font-mono text-[10.5px] uppercase tracking-wider ${t.category === "book-ahead" ? "text-caution" : "text-forest"}`}>{KIND[t.category]}</span>
              {t.stop && <span className="font-mono text-[10.5px] uppercase tracking-wider text-muted">{t.stop}</span>}
            </div>
            <h3 className="mt-3 font-display text-[23px] leading-tight">{t.title}</h3>
            <p className="mt-2 flex-1 text-[14px] leading-relaxed text-ink-2">{clean(t.detail)}</p>
            {t.bestWhen && (
              <p className="mt-4 flex items-center gap-1.5 text-[12.5px] text-ink-2">
                <Clock className="h-3.5 w-3.5 text-muted" strokeWidth={1.75} /> {t.bestWhen}
              </p>
            )}
          </article>
        ))}
      </div>
    </Section>
  );
}
