/**
 * Client-side persistence in localStorage: recent briefings, the
 * questionnaire draft and packing-list ticks. All access is wrapped in
 * try/catch because storage can be unavailable (private mode, quota).
 */
import type { Briefing } from "./types";

const KEY = "tripcast:briefings";
const MAX_SAVED = 8;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

export function saveBriefing(b: Briefing) {
  const list = read<Briefing[]>(KEY, []).filter((x) => x.id !== b.id);
  write(KEY, [b, ...list].slice(0, MAX_SAVED));
}

export function loadBriefing(id: string): Briefing | null {
  return read<Briefing[]>(KEY, []).find((b) => b.id === id) ?? null;
}

export const loadDraft = <T,>(fallback: T) => read<T>("tripcast:draft", fallback);
export const saveDraft = (draft: unknown) => write("tripcast:draft", draft);

export const loadTicks = (id: string) => new Set(read<string[]>(`tripcast:packed:${id}`, []));
export const saveTicks = (id: string, ticks: Set<string>) => write(`tripcast:packed:${id}`, [...ticks]);
