"use client";
/**
 * Dashboard: lays out the briefing sections on a 12-column grid.
 * Collapses to a single column on small screens.
 */
import Link from "next/link";
import { Printer, Plus } from "lucide-react";
import type { Briefing } from "@/lib/types";
import { dateRange, label, nights } from "@/lib/format";
import { Verdict } from "./Verdict";
import { Itinerary } from "./Itinerary";
import { Weather } from "./Weather";
import { HeadsUp } from "./HeadsUp";
import { Packing } from "./Packing";
import { ThingsToDo } from "./ThingsToDo";
import { News } from "./News";
import { Tips } from "./Tips";
import { Alternatives } from "./Alternatives";
import { Sources } from "./Sources";

export function Dashboard({ b }: { b: Briefing }) {
  const stops = b.trip.stops;
  const first = stops[0];
  const last = stops[stops.length - 1];
  const totalNights = stops.reduce((n, s) => n + nights(s.startDate, s.endDate), 0);
  const news = b.facts.flatMap((f) => f.news);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
      {/* Title row */}
      <div className="animate-rise flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">{b.id === "sample" ? "Sample briefing" : "Your briefing"} · {dateRange(first.startDate, last.endDate)} · {totalNights} nights</p>
          <h1 className="mt-4 font-display text-[46px] leading-[0.98] sm:text-[68px]">
            {stops.map((s, i) => (
              <span key={i}>
                {i > 0 && <span className="text-muted"> → </span>}
                {s.name}
              </span>
            ))}
          </h1>
          <p className="mt-3 text-[15px] text-ink-2">
            {label(b.trip.group)}
            {b.trip.withKids && " with children"}
            {b.trip.withSeniors && " with older adults"} · {label(b.trip.purpose)} · {label(b.trip.pace)} pace · {label(b.trip.budget)}
          </p>
        </div>
        <div className="no-print flex gap-2">
          <button onClick={() => window.print()} className="btn btn-ghost h-10 px-4 text-[14px]">
            <Printer className="h-4 w-4" strokeWidth={1.75} /> Save PDF
          </button>
          <Link href="/plan" className="btn btn-ink h-10 px-4 text-[14px]">
            <Plus className="h-4 w-4" /> New briefing
          </Link>
        </div>
      </div>

      {/* min-w-0 keeps wide children (the forecast row) from overflowing on small screens. */}
      <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-12 [&>*]:min-w-0">
        <div className="animate-rise lg:col-span-8 [animation-delay:60ms]"><Verdict verdict={b.ai.verdict} /></div>
        <div className="animate-rise lg:col-span-4 [animation-delay:120ms]"><Itinerary facts={b.facts} /></div>
        <div className="lg:col-span-12"><Weather facts={b.facts} /></div>
        <div className="lg:col-span-7"><HeadsUp items={b.ai.headsUp} /></div>
        <div className="lg:col-span-5 lg:row-span-2"><Packing id={b.id} groups={b.ai.packing} /></div>
        <div className="lg:col-span-7"><Tips tips={b.ai.tips} /></div>
        <div className="lg:col-span-12"><ThingsToDo items={b.ai.todo} /></div>
        <div className="lg:col-span-12"><News news={b.ai.news} items={news} /></div>
        <div className="lg:col-span-12"><Alternatives alt={b.ai.alternatives} facts={b.facts} /></div>
      </div>

      <Sources b={b} />
    </main>
  );
}
