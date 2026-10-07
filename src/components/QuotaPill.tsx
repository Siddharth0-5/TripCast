"use client";
/**
 * QuotaPill: header badge showing whether the Gemini key is configured and valid.
 */
import { useEffect, useState } from "react";

type StatusReply = { configured: boolean; ok: boolean; error?: string; hint?: string };

const PILL = "hidden items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider sm:inline-flex";

export function QuotaPill() {
  const [data, setData] = useState<StatusReply | null>(null);

  useEffect(() => {
    fetch("/api/quota")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) return null;

  if (!data.configured) {
    return (
      <span title="Add your Gemini key to .env.local" className={`${PILL} border-caution/40 text-caution`}>
        <span className="h-1.5 w-1.5 rounded-full bg-caution" /> AI key missing
      </span>
    );
  }
  if (!data.ok) {
    return (
      <span title={[data.error, data.hint].filter(Boolean).join(" ")} className={`${PILL} border-warn/40 text-warn`}>
        <span className="h-1.5 w-1.5 rounded-full bg-warn" /> AI key problem
      </span>
    );
  }
  return (
    <span title="Google Gemini (free tier) is connected. Each briefing uses 1–2 requests." className={`${PILL} border-line text-ink-2`}>
      <span className="h-1.5 w-1.5 rounded-full bg-go" /> AI ready
    </span>
  );
}
