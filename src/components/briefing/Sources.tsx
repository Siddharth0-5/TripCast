/**
 * Sources: data attribution, any missing sources, and the model used.
 */
import type { Briefing } from "@/lib/types";
import { stamp } from "@/lib/format";

export function Sources({ b }: { b: Briefing }) {
  const gaps = b.facts.flatMap((f) => f.problems.map((p) => `${f.stop.name}: ${p}`));
  return (
    <footer className="mt-4 grid gap-8 border-t border-line pt-8 text-[13px] text-muted md:grid-cols-3">
      <div>
        <p className="eyebrow mb-3">Sources</p>
        <ul className="space-y-1.5">
          <li>Weather: <a className="underline decoration-line underline-offset-2 hover:text-ink" href="https://open-meteo.com" target="_blank" rel="noreferrer">Open-Meteo</a> (forecast + ERA5 history)</li>
          {b.facts.map((f) => f.guide && (
            <li key={f.guide.url}>Guide: <a className="underline decoration-line underline-offset-2 hover:text-ink" href={f.guide.url} target="_blank" rel="noreferrer">Wikivoyage: {f.stop.name}</a> (CC BY-SA)</li>
          ))}
          {[...new Map(b.facts.filter((f) => f.advisory).map((f) => [f.advisory!.url, f.advisory!])).values()].map((a) => (
            <li key={a.url}>Safety: <a className="underline decoration-line underline-offset-2 hover:text-ink" href={a.url} target="_blank" rel="noreferrer">GOV.UK: {a.country}</a></li>
          ))}
          <li>News: Google News{b.facts.some((f) => f.news.some((n) => n.source === "The Guardian")) ? ", The Guardian" : ""}</li>
        </ul>
      </div>
      <div>
        <p className="eyebrow mb-3">About this briefing</p>
        <p>Created {stamp(b.createdAt)}.</p>
        <p className="mt-1">Written by <span className="font-mono text-[12px] text-ink-2">{b.model}</span>, a free AI model, from the facts listed here.</p>
        {gaps.length > 0 && <p className="mt-3 text-caution">Missing data: {gaps.join("; ")}.</p>}
      </div>
      <div>
        <p className="eyebrow mb-3">Please note</p>
        <p>AI can make mistakes. Check entry requirements, official travel advice and bookings with the original sources before you travel.</p>
      </div>
    </footer>
  );
}
