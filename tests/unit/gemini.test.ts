/** Offline tests for Gemini request mapping and model allow-list. */
import { describe, it, expect } from "vitest";
import { toGemini } from "@/lib/ai/gemini";
import { chooseModels, isAllowed } from "@/lib/ai/models";

describe("toGemini", () => {
  it("keeps the rules apart and renames the AI's turns to 'model'", () => {
    const out = toGemini([
      { role: "system", content: "Rules" },
      { role: "user", content: "Facts" },
      { role: "assistant", content: "{bad}" },
      { role: "user", content: "Fix it" },
    ]);
    expect(out.system).toBe("Rules");
    expect(out.contents.map((c) => c.role)).toEqual(["user", "model", "user"]);
    expect(out.contents[1].parts[0].text).toBe("{bad}");
  });
});

describe("model safety rule", () => {
  it("only allows free-tier Flash models", () => {
    expect(isAllowed("gemini-3.5-flash-lite")).toBe(true);
    expect(isAllowed("gemini-flash-latest")).toBe(true);
    expect(isAllowed("gemini-3.1-pro-preview")).toBe(false);
    expect(isAllowed("gpt-5")).toBe(false);
  });
  it("ignores non-free models set in .env.local", () => {
    process.env.GEMINI_MODELS = "gemini-3.1-pro-preview, gemini-3.8-flash";
    expect(chooseModels()).toEqual(["gemini-3.8-flash"]);
    delete process.env.GEMINI_MODELS;
  });
});
