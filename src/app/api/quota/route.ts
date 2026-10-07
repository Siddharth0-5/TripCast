/**
 * GET /api/quota: reports whether the Gemini key is present and accepted.
 * Gemini exposes no remaining-quota endpoint; listing models doesn't use any quota.
 */
import { checkKey, AiError } from "@/lib/ai/gemini";

export async function GET() {
  try {
    await checkKey();
    return Response.json({ configured: true, ok: true });
  } catch (e) {
    const err = e as AiError;
    const noKey = err.message.startsWith("No Gemini key");
    return Response.json({ configured: !noKey, ok: false, error: err.message, hint: err.hint });
  }
}
