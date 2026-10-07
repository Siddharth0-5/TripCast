"use client";
/**
 * Packing: checklist with ticks persisted to localStorage per briefing.
 */
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import type { AiReport } from "@/lib/types";
import { loadTicks, saveTicks } from "@/lib/storage";
import { Section } from "./Section";

export function Packing({ id, groups }: { id: string; groups: AiReport["packing"] }) {
  const [ticks, setTicks] = useState<Set<string>>(new Set());
  // eslint-disable-next-line react-hooks/set-state-in-effect -- browser storage is only readable after mount
  useEffect(() => setTicks(loadTicks(id)), [id]);

  const total = groups.reduce((n, g) => n + g.items.length, 0);
  const toggle = (key: string) => {
    const next = new Set(ticks);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setTicks(next);
    saveTicks(id, next);
  };

  return (
    <Section
      eyebrow="Packing list"
      title="What to bring"
      aside={<span className="mt-1 font-mono text-[12px] text-muted">{ticks.size}/{total} packed</span>}
    >
      <div className="space-y-6">
        {groups.map((g) => (
          <div key={g.category}>
            <p className="eyebrow mb-2">{g.category}</p>
            <ul>
              {g.items.map((it) => {
                const key = `${g.category}:${it.item}`;
                const on = ticks.has(key);
                return (
                  <li key={key}>
                    <button onClick={() => toggle(key)} className="group grid w-full grid-cols-[22px_1fr] gap-3 rounded-xl py-2 text-left" aria-pressed={on}>
                      <span className={`mt-0.5 grid h-[18px] w-[18px] place-items-center rounded-[5px] border transition-colors ${on ? "border-forest bg-forest text-paper" : "border-muted/60 group-hover:border-ink"}`}>
                        {on && <Check className="h-3 w-3" strokeWidth={3} />}
                      </span>
                      <span>
                        <span className={`block text-[15px] ${on ? "text-muted line-through" : ""}`}>{it.item}</span>
                        <span className="block text-[13px] leading-snug text-muted">{it.why}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}
