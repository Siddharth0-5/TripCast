/**
 * Gemini API client (free tier). Tries models in order, moving on when one
 * is busy, unavailable or too slow, and maps API errors to user-facing
 * messages. The API key is read server-side only.
 */
export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export class AiError extends Error {
  constructor(message: string, public hint?: string, public status?: number) {
    super(message);
  }
}

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export function getKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim() ?? "";
  if (!key || key.startsWith("paste-")) {
    throw new AiError(
      "No Gemini API key found.",
      "Add GEMINI_API_KEY to .env.local (see README), then restart the app.",
    );
  }
  return key;
}

/** Maps a Gemini error response to an AiError with a user-facing hint. */
function explain(status: number, body: string): AiError {
  const msg = (() => {
    try {
      return JSON.parse(body)?.error?.message ?? body;
    } catch {
      return body;
    }
  })();
  if (status === 401 || status === 403 || /API key/i.test(msg)) {
    return new AiError("Google didn't accept the Gemini API key.", "Copy the key again from aistudio.google.com/apikey into GEMINI_API_KEY in .env.local, then restart.", 401);
  }
  // Rate limits are per model, so the caller moves on to the next one.
  if (status === 429) {
    const daily = /per ?day/i.test(body);
    return new AiError(
      daily ? "The daily request limit for this model was reached." : "Too many requests in one minute.",
      daily ? "The limit resets at midnight Pacific time. Other models may still work." : "Wait a minute and try again.",
      429,
    );
  }
  if (status === 503 || status === 500) return new AiError("This model is busy right now.", String(msg).slice(0, 200), 503);
  // 404 can be transient (empty body) or a retired model.
  if (status === 404) return new AiError("This model isn't available right now.", String(msg || "No details given.").slice(0, 200), 404);
  return new AiError(`The AI service had a problem (${status}).`, String(msg).slice(0, 200), status);
}

/** Time budget for a single model before falling through to the next. */
const PER_MODEL_MS = 60_000;

/** Errors another model can't fix (bad key, bad request). */
function isFatal(err: AiError): boolean {
  return err.status === 400 || err.status === 401;
}

/**
 * Sends the conversation to the first model that answers in time.
 * `deadline` is an absolute timestamp (ms) for the whole call.
 */
export async function chat(opts: {
  models: string[]; // in order of preference
  messages: ChatMessage[];
  maxTokens?: number;
  deadline?: number;
}): Promise<{ text: string; model: string }> {
  const deadline = opts.deadline ?? Date.now() + 4 * 60_000;
  let lastError: AiError | null = null;

  for (const model of opts.models) {
    const timeLeft = deadline - Date.now();
    if (timeLeft < 15_000) break; // too little time for a full reply
    try {
      return await askOne(model, opts.messages, opts.maxTokens ?? 8000, Math.min(PER_MODEL_MS, timeLeft));
    } catch (e) {
      const err = e instanceof AiError ? e : toAiError(e, model);
      console.warn(`[ai] ${model} failed: ${err.message}`);
      if (isFatal(err)) throw err;
      lastError = err;
    }
  }
  throw lastError ?? new AiError("The AI service is too slow right now.", "Please try again in a few minutes.");
}

/** Wraps network and timeout failures. */
function toAiError(e: unknown, model: string): AiError {
  const name = (e as Error)?.name;
  if (name === "TimeoutError" || name === "AbortError") {
    return new AiError("The AI service is too slow right now.", `${model} took too long. Please try again in a few minutes.`);
  }
  return new AiError("Couldn't reach the AI service.", String((e as Error)?.message ?? e).slice(0, 200));
}

/** Converts chat messages to Gemini's format (separate system instruction, "model" role). */
export function toGemini(messages: ChatMessage[]) {
  const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
  return { system, contents };
}

type GeminiReply = {
  candidates?: Array<{ finishReason?: string; content?: { parts?: Array<{ text?: string; thought?: boolean }> } }>;
  promptFeedback?: { blockReason?: string };
};

async function askOne(model: string, messages: ChatMessage[], maxTokens: number, timeoutMs: number) {
  const { system, contents } = toGemini(messages);
  const res = await fetch(`${BASE}/${model}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": getKey(), "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
      generationConfig: {
        temperature: 0.2, // keep the output close to the facts
        maxOutputTokens: maxTokens,
        responseMimeType: "application/json",
      },
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  const body = await res.text();
  if (!res.ok) throw explain(res.status, body);

  const data = JSON.parse(body) as GeminiReply;
  if (data.promptFeedback?.blockReason) {
    throw new AiError("The request was blocked.", `Google's safety filter said: ${data.promptFeedback.blockReason}. Try rewording the notes.`, 400);
  }
  // Thinking models return thoughts as separate parts; keep only the answer.
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const text = parts.filter((p) => !p.thought).map((p) => p.text ?? "").join("");
  if (!text.trim()) throw new AiError("The model sent back an empty answer.", "This happens when a model is busy. Please try again.");
  return { text, model };
}

/** Verifies the key by listing models (doesn't count against generation quota). */
export async function checkKey(): Promise<void> {
  const res = await fetch(`${BASE}?pageSize=1`, {
    headers: { "x-goog-api-key": getKey() },
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) throw explain(res.status, await res.text());
}
