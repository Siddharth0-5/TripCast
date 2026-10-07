/** GET /api/places?q=lisb: place autocomplete, proxied to Open-Meteo geocoding. */
import { searchPlaces } from "@/lib/sources/places";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  try {
    return Response.json({ places: await searchPlaces(q.slice(0, 80)) });
  } catch {
    return Response.json({ places: [], error: "Place search is unavailable right now." }, { status: 502 });
  }
}
