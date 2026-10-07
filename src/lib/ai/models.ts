/**
 * Gemini model order. GEMINI_MODELS in .env.local overrides the default list.
 * Only Flash models (free tier) are allowed.
 */
const DEFAULT_MODELS = [
  "gemini-3.5-flash-lite", // fastest and most reliable
  "gemini-3.8-flash", // stronger, but often busy on the free tier
  "gemini-flash-lite-latest", // alias, in case a pinned model is retired
];

export const isAllowed = (id: string) => /^gemini-[\w.-]*flash/.test(id);

export function chooseModels(): string[] {
  const fromEnv = (process.env.GEMINI_MODELS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const usable = (fromEnv.length ? fromEnv : DEFAULT_MODELS).filter(isAllowed);
  return usable.length ? usable : DEFAULT_MODELS;
}
