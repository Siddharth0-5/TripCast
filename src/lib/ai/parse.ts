/**
 * Extracts and validates the JSON report from a model reply, tolerating code
 * fences, surrounding text, trailing commas and smart quotes.
 */
import { AiReportSchema, type AiReport } from "../types";

/** Returns the first balanced {...} block, ignoring braces inside strings. */
export function extractJsonObject(raw: string): string | null {
  const text = raw.replace(/```(?:json)?/gi, "");
  const start = text.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
    } else if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return text.slice(start, i + 1);
  }
  return null; // unbalanced: reply was truncated
}

/** Fixes trailing commas and smart quotes. */
function repair(json: string): string {
  return json.replace(/,\s*([}\]])/g, "$1").replace(/[“”]/g, '"');
}

// `missing`: sections left empty (usable, but worth a retry).
type ParseResult = { ok: true; report: AiReport; missing: string[] } | { ok: false; reason: string };

export function parseAiReport(raw: string): ParseResult {
  const block = extractJsonObject(raw);
  if (!block) return { ok: false, reason: "no complete JSON object found (reply may be cut off)" };

  let data: unknown;
  try {
    data = JSON.parse(block);
  } catch {
    try {
      data = JSON.parse(repair(block));
    } catch (e) {
      return { ok: false, reason: `invalid JSON: ${(e as Error).message}` };
    }
  }

  const checked = AiReportSchema.safeParse(data);
  if (!checked.success) return { ok: false, reason: checked.error.issues.slice(0, 3).map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };

  const r = checked.data;
  const useful = r.headsUp.length + r.todo.length + r.packing.length;
  if (!r.verdict.summary || useful < 3) return { ok: false, reason: "the answer was too empty to be useful" };
  return { ok: true, report: r, missing: missingSections(r) };
}

/** Later sections that came back empty (models sometimes stop early). */
function missingSections(r: AiReport): string[] {
  const missing: string[] = [];
  if (!r.news.summary) missing.push("news");
  if (r.tips.length === 0) missing.push("tips");
  if (r.alternatives.destinations.length === 0) missing.push("alternative destinations");
  if (!r.alternatives.timing) missing.push("alternative timing");
  return missing;
}
