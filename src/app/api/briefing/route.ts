/**
 * POST /api/briefing: validates the trip and streams progress as NDJSON
 * ({"type":"step"…} lines, then a final "done" or "error" event).
 * If the client disconnects, the build still finishes so the result is cached.
 */
import { TripInputSchema, type ProgressEvent } from "@/lib/types";
import { buildBriefing } from "@/lib/briefing";
import { AiError, getKey } from "@/lib/ai/gemini";
import { addDays, todayIso } from "@/lib/sources/weather";

// Upper bound for serverless hosts such as Vercel.
export const maxDuration = 300;

/** Date rules the schema can't express. */
function checkDates(stops: { name: string; startDate: string; endDate: string }[]): string | null {
  const today = todayIso();
  for (const s of stops) {
    if (s.endDate < s.startDate) return `${s.name}: the end date is before the start date.`;
    if (s.endDate < addDays(today, -1)) return `${s.name}: these dates are in the past.`;
    if (s.startDate > addDays(today, 540)) return `${s.name}: please pick dates within the next 18 months.`;
    if (Date.parse(s.endDate) - Date.parse(s.startDate) > 60 * 86_400_000) return `${s.name}: a single stop can be at most 60 nights.`;
  }
  return null;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = TripInputSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ type: "error", message: "Some answers look invalid.", hint: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const dateProblem = checkDates(parsed.data.stops);
  if (dateProblem) return Response.json({ type: "error", message: dateProblem }, { status: 400 });

  try {
    getKey(); // fail fast if the key is missing
  } catch (e) {
    const err = e as AiError;
    return Response.json({ type: "error", message: err.message, hint: err.hint }, { status: 400 });
  }

  const encoder = new TextEncoder();
  let gone = false; // client disconnected
  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: ProgressEvent) => {
        if (gone) return;
        try {
          controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
        } catch {
          gone = true;
        }
      };
      try {
        send({ type: "step", step: "places" });
        const { briefing, cached } = await buildBriefing(parsed.data, send);
        send({ type: "done", briefing, cached });
      } catch (e) {
        const err = e as AiError;
        console.error("[briefing]", err);
        send({ type: "error", message: err.message || "Something went wrong.", hint: err.hint });
      } finally {
        if (!gone) controller.close();
      }
    },
    cancel() {
      gone = true;
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}
