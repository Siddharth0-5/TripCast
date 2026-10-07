/**
 * Builds a briefing for a trip: gathers facts for every stop in parallel,
 * asks the model to write the report from them, validates the reply (schema,
 * empty sections, unsupported numbers) and retries once on another model.
 * Results are cached for 6 hours.
 */
import { createHash, randomUUID } from "node:crypto";
import { getStopWeather, todayIso } from "./sources/weather";
import { getStopNews } from "./sources/news";
import { getStopGuide } from "./sources/guide";
import { getAdvisory } from "./sources/advisory";
import { chooseModels } from "./ai/models";
import { chat, AiError, type ChatMessage } from "./ai/gemini";
import { buildMessages } from "./ai/prompt";
import { parseAiReport } from "./ai/parse";
import { unsupportedNumbers } from "./ai/grounding";
import { peek, put, HOUR } from "./cache";
import type { AiReport, Briefing, ProgressEvent, StopFacts, TripInput } from "./types";

type StepFn = (e: Extract<ProgressEvent, { type: "step" }>) => void;

const MAX_ATTEMPTS = 2;

/** Fetches all sources for every stop. Never throws; failed sources are recorded in `problems`. */
export async function gatherFacts(trip: TripInput, onStep: StepFn = () => {}): Promise<StopFacts[]> {
  onStep({ type: "step", step: "weather" });
  const perStop = trip.stops.map(async (stop) => {
    const [weather, news, guide, advisory] = await Promise.allSettled([
      getStopWeather(stop),
      getStopNews(stop).finally(() => onStep({ type: "step", step: "news", detail: stop.name })),
      getStopGuide(stop).finally(() => onStep({ type: "step", step: "guides", detail: stop.name })),
      getAdvisory(stop.country).finally(() => onStep({ type: "step", step: "advisories", detail: stop.country })),
    ]);
    const problems: string[] = [];
    const ok = <T,>(r: PromiseSettledResult<T>, label: string): T | null => {
      if (r.status === "fulfilled") return r.value;
      problems.push(`${label} unavailable (${(r.reason as Error)?.message ?? "error"})`);
      return null;
    };
    return {
      stop,
      weather: ok(weather, "weather"),
      news: ok(news, "news") ?? [],
      guide: ok(guide, "travel guide"),
      advisory: ok(advisory, "safety advice"),
      problems,
    } satisfies StopFacts;
  });
  const facts = await Promise.all(perStop);

  // Number headlines across all stops (N1, N2…), dropping stories already listed for an earlier stop.
  let n = 0;
  const seen = new Set<string>();
  for (const f of facts) {
    f.news = f.news.filter((item) => {
      if (seen.has(item.url) || seen.has(item.title)) return false;
      seen.add(item.url);
      seen.add(item.title);
      return true;
    });
    for (const item of f.news) item.id = `N${++n}`;
  }
  return facts;
}

function tripKey(trip: TripInput): string {
  return createHash("sha1").update(JSON.stringify(trip)).digest("hex").slice(0, 16);
}

export async function buildBriefing(trip: TripInput, onStep: StepFn = () => {}): Promise<{ briefing: Briefing; cached: boolean }> {
  const key = `briefing:${tripKey(trip)}`;
  const cached = peek<Briefing>(key);
  if (cached) return { briefing: cached, cached: true };

  const facts = await gatherFacts(trip, onStep);
  const models = chooseModels();
  const messages: ChatMessage[] = buildMessages(trip, facts, todayIso());

  // Leaves headroom under the route's 5-minute maxDuration.
  const deadline = Date.now() + 4 * 60_000;
  let lastProblem = "";
  const factPack = messages[1].content;
  // Best usable-but-imperfect answer so far, kept in case the retry fails.
  let fallback: { ai: AiReport; model: string; issues: number } | null = null;
  const finish = (ai: AiReport, model: string) => {
    const briefing: Briefing = { id: randomUUID().slice(0, 8), createdAt: new Date().toISOString(), trip, facts, ai, model };
    put(key, briefing, 6 * HOUR);
    return { briefing, cached: false };
  };

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // Retries start from the next model in the list.
    const order = [...models.slice(attempt), ...models.slice(0, attempt)];
    onStep({ type: "step", step: attempt === 0 ? "writing" : "checking", detail: order[0] });

    let reply: { text: string; model: string };
    try {
      reply = await chat({ models: order, messages, deadline });
    } catch (e) {
      if (fallback) return finish(fallback.ai, fallback.model);
      throw e;
    }
    const parsed = parseAiReport(reply.text);
    if (parsed.ok) {
      const invented = unsupportedNumbers(parsed.report, factPack);
      const issues = [
        parsed.missing.length ? `these sections were left empty: ${parsed.missing.join(", ")}` : "",
        invented.length ? `these numbers are not in the fact pack: ${invented.join(", ")} — use only numbers from the facts, or leave them out` : "",
      ].filter(Boolean);
      if (issues.length === 0) return finish(parsed.report, reply.model);
      console.warn(`[ai] answer had problems: ${issues.join("; ")}`);
      const count = parsed.missing.length + invented.length;
      if (!fallback || count < fallback.issues) fallback = { ai: parsed.report, model: reply.model, issues: count };
      lastProblem = issues.join("; ");
    } else {
      lastProblem = parsed.reason;
      console.warn(`[ai] answer unusable: ${lastProblem}`);
    }
    // Feed the reply back with the problems so the next attempt can correct them.
    messages.push(
      { role: "assistant", content: reply.text.slice(0, 12000) },
      { role: "user", content: `That reply could not be used as-is (${lastProblem}). Reply again with ONLY the complete JSON object in the exact shape requested. Every section needs at least some content, and every fact must come from the fact pack.` },
    );
  }
  if (fallback) return finish(fallback.ai, fallback.model);
  throw new AiError("The briefing didn't come out right.", `Last problem: ${lastProblem}. Please try again in a minute.`);
}
