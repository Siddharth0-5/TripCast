"use client";
/**
 * Generating: posts the trip to /api/briefing and consumes the NDJSON progress
 * stream, updating the step list until the finished briefing arrives.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, RotateCcw, PencilLine } from "lucide-react";
import type { ProgressEvent, TripInput } from "@/lib/types";
import { saveBriefing } from "@/lib/storage";

const STEPS = [
  { id: "weather", text: "Reading forecasts and five years of weather" },
  { id: "news", text: "Scanning recent news" },
  { id: "guides", text: "Consulting the travel guide" },
  { id: "advisories", text: "Checking official safety advice" },
  { id: "writing", text: "Writing your briefing" },
] as const;
type StepId = (typeof STEPS)[number]["id"];
type Status = "waiting" | "active" | "done";

export function Generating({ trip, onEdit }: { trip: TripInput; onEdit: () => void }) {
  const router = useRouter();
  const [status, setStatus] = useState<Record<StepId, Status>>(() => ({ weather: "active", news: "waiting", guides: "waiting", advisories: "waiting", writing: "waiting" }));
  const [writingNote, setWritingNote] = useState("");
  const [error, setError] = useState<{ message: string; hint?: string } | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const started = useRef(-1);

  // Per-stop steps complete once every stop has reported.
  const counts = useRef<Record<string, number>>({});

  const handle = useCallback(
    (e: ProgressEvent) => {
      if (e.type === "step") {
        if (e.step === "news" || e.step === "guides" || e.step === "advisories") {
          const n = (counts.current[e.step] = (counts.current[e.step] ?? 0) + 1);
          setStatus((s) => ({ ...s, [e.step]: n >= trip.stops.length ? "done" : "active" }));
        }
        if (e.step === "writing" || e.step === "checking") {
          setStatus({ weather: "done", news: "done", guides: "done", advisories: "done", writing: "active" });
          setWritingNote(e.step === "checking" ? "The first draft didn't pass our checks. Trying again…" : "");
        }
      }
      if (e.type === "done") {
        saveBriefing(e.briefing);
        router.replace(`/briefing?id=${e.briefing.id}`);
      }
      if (e.type === "error") setError({ message: e.message, hint: e.hint });
    },
    [router, trip.stops.length],
  );

  useEffect(() => {
    if (started.current === attempt) return; // guard against Strict Mode double-invoke
    started.current = attempt;
    counts.current = {};

    (async () => {
      try {
        const res = await fetch("/api/briefing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(trip) });
        if (!res.body) throw new Error("No response from the server.");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? ""; // keep any partial line
          for (const line of lines) if (line.trim()) handle(JSON.parse(line));
        }
        if (buffer.trim()) handle(JSON.parse(buffer));
      } catch (e) {
        setError({ message: "Couldn't reach the Tripcast server.", hint: (e as Error).message });
      }
    })();
  }, [attempt, handle, trip]);

  // Elapsed-time counter.
  useEffect(() => {
    if (error) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [error, attempt]);

  const places = trip.stops.map((s) => s.name).join(" → ");

  return (
    <div className="mx-auto w-full max-w-xl animate-rise px-4 pb-24 pt-16 sm:px-6 sm:pt-24">
      <p className="eyebrow">{error ? "Something went wrong" : "Preparing your briefing"}</p>
      <h1 className="mt-5 font-display text-[44px] leading-[1.02] sm:text-[56px]">{places}</h1>

      {!error && (
        <>
          <ol className="mt-12 space-y-0 border-t border-line">
            {STEPS.map((s) => {
              const st = status[s.id];
              return (
                <li key={s.id} className="flex items-center gap-4 border-b border-line py-4">
                  <span className="grid h-6 w-6 place-items-center">
                    {st === "done" && <Check className="h-4 w-4 text-go" strokeWidth={2.25} />}
                    {st === "active" && <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-forest" />}
                    {st === "waiting" && <span className="h-1.5 w-1.5 rounded-full bg-line" />}
                  </span>
                  <span className={`text-[16px] ${st === "waiting" ? "text-muted" : ""}`}>{s.text}</span>
                </li>
              );
            })}
          </ol>
          <p className="mt-6 font-mono text-[12px] text-muted">
            {seconds}s · {writingNote || (status.writing === "active" ? "The AI usually takes 5–20 seconds." : "Gathering live facts…")}
          </p>
        </>
      )}

      {error && (
        <div className="mt-10 rounded-[20px] border border-warn/30 bg-card p-6">
          <p className="text-[17px] font-medium">{error.message}</p>
          {error.hint && <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{error.hint}</p>}
          <div className="mt-6 flex flex-wrap gap-3">
            <button className="btn btn-ink" onClick={() => { setError(null); setSeconds(0); setStatus({ weather: "active", news: "waiting", guides: "waiting", advisories: "waiting", writing: "waiting" }); setAttempt((a) => a + 1); }}>
              <RotateCcw className="h-4 w-4" /> Try again
            </button>
            <button className="btn btn-ghost" onClick={onEdit}>
              <PencilLine className="h-4 w-4" /> Edit answers
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
