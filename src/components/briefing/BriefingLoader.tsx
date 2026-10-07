"use client";
/**
 * BriefingLoader: looks up a briefing by id in localStorage. Briefings are
 * stored client-side only, so they exist only on the device that created them.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Briefing } from "@/lib/types";
import { loadBriefing } from "@/lib/storage";
import { Dashboard } from "./Dashboard";

export function BriefingLoader({ id }: { id: string }) {
  const [state, setState] = useState<{ status: "loading" } | { status: "found"; b: Briefing } | { status: "missing" }>({ status: "loading" });

  useEffect(() => {
    const b = loadBriefing(id);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser storage is only readable after mount
    setState(b ? { status: "found", b } : { status: "missing" });
  }, [id]);

  if (state.status === "loading") return <div className="flex-1" />;
  if (state.status === "found") return <Dashboard b={state.b} />;
  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
      <p className="eyebrow">Briefing not found</p>
      <h1 className="mt-4 font-display text-[48px] leading-tight">This briefing isn&apos;t on this device.</h1>
      <p className="mt-4 text-[16px] text-ink-2">Briefings are kept in the browser that created them. Make a new one. It takes under a minute.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/plan" className="btn btn-ink">Plan a trip</Link>
        <Link href="/briefing?id=sample" className="btn btn-ghost">See the sample</Link>
      </div>
    </main>
  );
}
