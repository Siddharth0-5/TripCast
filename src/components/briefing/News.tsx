/**
 * News: model summary plus the headlines it picked. Picks reference fetched
 * articles by id, so every link shown comes from the source feed.
 */
import { ArrowUpRight } from "lucide-react";
import type { AiReport, NewsItem } from "@/lib/types";
import { ago } from "@/lib/format";
import { Section } from "./Section";
import { clean } from "./Verdict";

const MOOD = {
  calm: { text: "Calm", tone: "text-go border-go/40" },
  mixed: { text: "Mixed", tone: "text-caution border-caution/40" },
  concerning: { text: "Concerning", tone: "text-warn border-warn/40" },
  unknown: { text: "Quiet", tone: "text-muted border-line" },
};

export function News({ news, items }: { news: AiReport["news"]; items: NewsItem[] }) {
  const byId = new Map(items.map((n) => [n.id, n]));
  const picks = news.picks.flatMap((p) => {
    const item = byId.get(p.id.trim().toUpperCase());
    return item ? [{ ...item, takeaway: p.takeaway }] : []; // drop unknown ids
  });
  const mood = MOOD[news.mood];

  return (
    <Section
      eyebrow="News digest"
      title="What's happening there"
      aside={<span className={`mt-1 rounded-full border px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-wider ${mood.tone}`}>{mood.text}</span>}
    >
      {news.summary && <p className="text-[15.5px] leading-relaxed text-ink-2">{clean(news.summary)}</p>}

      {picks.length > 0 && (
        <ul className="mt-5 divide-y divide-line border-y border-line">
          {picks.map((n) => (
            <li key={n.id} className="py-4">
              <a href={n.url} target="_blank" rel="noreferrer" className="group block">
                <span className="flex items-start justify-between gap-3">
                  <span className="text-[15.5px] font-medium leading-snug group-hover:text-forest">{n.title}</span>
                  <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-muted group-hover:text-forest" strokeWidth={1.75} />
                </span>
                <span className="mt-1 block font-mono text-[11px] text-muted">{n.source} · {ago(n.date)}</span>
                <span className="mt-2 block text-[14px] leading-relaxed text-ink-2">{clean(n.takeaway)}</span>
              </a>
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <details className="group mt-4">
          <summary className="cursor-pointer list-none text-[13px] font-medium text-forest hover:text-ink">
            <span className="group-open:hidden">Show all {items.length} headlines we read</span>
            <span className="hidden group-open:inline">Hide headlines</span>
          </summary>
          <ul className="mt-3 space-y-2.5">
            {items.map((n) => (
              <li key={n.id} className="text-[13.5px] leading-snug">
                <a href={n.url} target="_blank" rel="noreferrer" className="hover:text-forest">{n.title}</a>
                <span className="text-muted"> · {n.source}, {n.stop}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
      {items.length === 0 && <p className="mt-2 text-[14px] text-muted">We couldn&apos;t find recent news for these places.</p>}
    </Section>
  );
}
