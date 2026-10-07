"use client";
/**
 * Weather: forecast strip (or climate averages when the trip is beyond the
 * forecast range) and a 12-month comfort chart. Tabs switch between stops.
 */
import { useState } from "react";
import { Droplets, Moon, Sun as SunIcon } from "lucide-react";
import type { StopFacts } from "@/lib/types";
import { MONTH_NAMES } from "@/lib/climate";
import { dayMonth, nights, temp, weekday } from "@/lib/format";
import { describeSky } from "@/lib/weather-codes";
import { SkyIcon } from "@/components/SkyIcon";
import { Section } from "./Section";

export function Weather({ facts }: { facts: StopFacts[] }) {
  const [tab, setTab] = useState(0);
  const f = facts[tab];
  const w = f.weather;
  const tripMonths = new Set([Number(f.stop.startDate.slice(5, 7)), Number(f.stop.endDate.slice(5, 7))]);
  const stayDays = nights(f.stop.startDate, f.stop.endDate) + 1;
  // Scale bars between the lowest and highest month so differences stay visible.
  const scores = w?.months.map((m) => m.comfort) ?? [0];
  const lo = Math.min(...scores), hi = Math.max(...scores);
  const barHeight = (c: number) => (hi === lo ? 70 : 18 + ((c - lo) / (hi - lo)) * 82);

  const tabs = facts.length > 1 && (
    <div className="no-print flex rounded-full border border-line bg-paper p-1">
      {facts.map((x, i) => (
        <button key={i} onClick={() => setTab(i)} className={`h-8 rounded-full px-3.5 text-[13px] transition-colors ${i === tab ? "bg-ink text-paper" : "text-ink-2 hover:text-ink"}`}>
          {x.stop.name}
        </button>
      ))}
    </div>
  );

  if (!w) {
    return (
      <Section eyebrow="Weather" title={f.stop.name} aside={tabs}>
        <p className="text-[15px] text-muted">Weather data wasn&apos;t available for this stop.</p>
      </Section>
    );
  }

  return (
    <Section
      eyebrow={w.mode === "forecast" ? `Forecast · ${w.forecast.length} of ${stayDays} days` : `Typical weather · ${w.yearsUsed} records`}
      title={f.stop.name}
      aside={tabs}
    >
      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] [&>*]:min-w-0">
        <div>
          {w.forecast.length > 0 ? (
            <div className="-mx-1 flex gap-1 overflow-x-auto pb-1">
              {w.forecast.map((d) => (
                <div key={d.date} className="flex min-w-[78px] flex-1 flex-col items-center gap-2 rounded-2xl px-1 py-3 hover:bg-paper-2/70" title={describeSky(d.code).label}>
                  <span className="font-mono text-[10.5px] uppercase tracking-wider text-muted">{weekday(d.date)}</span>
                  <span className="text-[12px] text-ink-2">{dayMonth(d.date)}</span>
                  <SkyIcon code={d.code} className="my-1 h-7 w-7 text-ink" />
                  <span className="font-mono text-[15px] font-medium">{temp(d.tMax)}</span>
                  <span className="font-mono text-[13px] text-muted">{temp(d.tMin)}</span>
                  <span className="mt-1 h-1 w-10 overflow-hidden rounded-full bg-paper-2">
                    <span className="block h-full bg-sky" style={{ width: `${d.rainChance ?? 0}%` }} />
                  </span>
                  <span className="font-mono text-[10.5px] text-sky">{d.rainChance ?? 0}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl bg-paper-2/60 px-4 py-3 text-[14px] text-ink-2">
              Your trip is more than 16 days away, so there&apos;s no forecast yet. Below is what the weather was like on these exact dates over the last five years.
            </p>
          )}

          {w.tripTypical && (
            <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
              {[
                ["Typical high", temp(w.tripTypical.tMax), SunIcon],
                ["Typical low", temp(w.tripTypical.tMin), Moon],
                ["Rainy days", `${w.tripTypical.rainyDaysPct}%`, Droplets],
                ["Rain per day", `${w.tripTypical.rainMm} mm`, Droplets],
              ].map(([k, v, Icon]) => {
                const I = Icon as typeof SunIcon;
                return (
                  <div key={k as string} className="bg-card px-4 py-4">
                    <dt className="flex items-center gap-1.5 text-[12px] text-muted"><I className="h-3.5 w-3.5" strokeWidth={1.75} />{k as string}</dt>
                    <dd className="mt-1 font-display text-[30px] leading-none">{v as string}</dd>
                  </div>
                );
              })}
            </dl>
          )}
          {w.forecast.some((d) => (d.uv ?? 0) >= 6) && <p className="mt-4 text-[13px] text-caution">High UV on some days. Plan for shade around midday.</p>}
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-[14px] font-medium">Best time to visit</span>
            {w.tripMonthRank && <span className="font-mono text-[11px] text-muted">your month ranks #{w.tripMonthRank}/12</span>}
          </div>
          <div className="mt-4 flex h-36 items-end gap-1.5" role="img" aria-label={`Comfort by month; best: ${w.bestMonths.map((m) => MONTH_NAMES[m - 1]).join(", ")}`}>
            {w.months.map((m) => {
              const best = w.bestMonths.includes(m.month);
              const yours = tripMonths.has(m.month);
              return (
                <div key={m.month} className="group relative flex h-full flex-1 flex-col justify-end">
                  <div
                    className={`w-full rounded-t-[5px] transition-colors ${yours ? "bg-ink" : best ? "bg-forest-2" : "bg-line group-hover:bg-muted/50"}`}
                    style={{ height: `${barHeight(m.comfort)}%` }}
                  />
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 font-mono text-[11px] text-paper group-hover:block">
                    {MONTH_NAMES[m.month - 1]} · {temp(m.tMax)}/{temp(m.tMin)} · {m.rainyDaysPct}% rainy · comfort {m.comfort}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex gap-1.5">
            {w.months.map((m) => (
              <span key={m.month} className={`flex-1 text-center font-mono text-[10px] ${tripMonths.has(m.month) ? "font-semibold text-ink" : "text-muted"}`}>
                {MONTH_NAMES[m.month - 1][0]}
              </span>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-2">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-ink" />Your trip</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-forest-2" />Best months</span>
            <span className="text-muted">Taller = more comfortable (20–26 °C, little rain)</span>
          </div>
        </div>
      </div>
    </Section>
  );
}
