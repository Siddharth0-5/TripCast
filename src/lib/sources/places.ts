/**
 * Place search via the Open-Meteo Geocoding API. Backs /api/places.
 */
import { fetchJson } from "../http";
import { remember, HOUR } from "../cache";

export type Place = {
  name: string;
  country: string;
  countryCode: string;
  admin: string;
  lat: number;
  lon: number;
  timezone: string;
  population: number;
};

type GeoResponse = {
  results?: Array<{
    name: string;
    country?: string;
    country_code?: string;
    admin1?: string;
    latitude: number;
    longitude: number;
    timezone?: string;
    population?: number;
  }>;
};

export async function searchPlaces(query: string): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  return remember(`places:${q.toLowerCase()}`, 24 * HOUR, async () => {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`;
    const data = await fetchJson<GeoResponse>(url, {}, 8_000);
    return (data.results ?? []).map((r) => ({
      name: r.name,
      country: r.country ?? "",
      countryCode: r.country_code ?? "",
      admin: r.admin1 ?? "",
      lat: r.latitude,
      lon: r.longitude,
      timezone: r.timezone ?? "auto",
      population: r.population ?? 0,
    }));
  });
}
