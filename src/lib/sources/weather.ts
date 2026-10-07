/**
 * Weather for a stop from Open-Meteo: the daily forecast (up to 16 days out)
 * and five years of history, summarised into typical conditions and best months.
 */
import { fetchJson } from "../http";
import { remember, HOUR } from "../cache";
import { summarizeClimate, type DayRecord } from "../climate";
import type { DailyWeather, Stop, StopWeather } from "../types";

const FORECAST_DAYS = 16;
const CLIMATE_YEARS = 5;

type DailyBlock = Record<string, Array<number | null>> & { time: string[] };

/** Today's date as "YYYY-MM-DD" (UTC). */
export function todayIso(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function getForecast(stop: Stop, from: string, to: string): Promise<DailyWeather[]> {
  const params = new URLSearchParams({
    latitude: String(stop.lat),
    longitude: String(stop.lon),
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,uv_index_max,wind_speed_10m_max",
    timezone: "auto",
    start_date: from,
    end_date: to,
  });
  const data = await fetchJson<{ daily: DailyBlock }>(`https://api.open-meteo.com/v1/forecast?${params}`);
  const d = data.daily;
  return d.time.map((date, i) => ({
    date,
    code: d.weather_code[i] ?? 3,
    tMax: d.temperature_2m_max[i] ?? NaN,
    tMin: d.temperature_2m_min[i] ?? NaN,
    rainChance: d.precipitation_probability_max[i] ?? null,
    rainMm: d.precipitation_sum[i] ?? 0,
    uv: d.uv_index_max[i] ?? null,
    windKmh: d.wind_speed_10m_max[i] ?? null,
  }));
}

/** Five full past years of daily history, cached for a week. */
async function getHistory(lat: number, lon: number): Promise<{ days: DayRecord[]; years: string }> {
  const lastYear = new Date().getUTCFullYear() - 1;
  const firstYear = lastYear - CLIMATE_YEARS + 1;
  // Round to ~10 km so nearby stops share a cache entry.
  const rlat = Math.round(lat * 10) / 10;
  const rlon = Math.round(lon * 10) / 10;
  return remember(`history:${rlat},${rlon}:${firstYear}`, 7 * 24 * HOUR, async () => {
    const params = new URLSearchParams({
      latitude: String(rlat),
      longitude: String(rlon),
      start_date: `${firstYear}-01-01`,
      end_date: `${lastYear}-12-31`,
      daily: "temperature_2m_max,temperature_2m_min,precipitation_sum",
      timezone: "auto",
    });
    const data = await fetchJson<{ daily: DailyBlock }>(`https://archive-api.open-meteo.com/v1/archive?${params}`, {}, 20_000);
    const d = data.daily;
    const days = d.time.map((date, i) => ({
      date,
      tMax: d.temperature_2m_max[i] ?? NaN,
      tMin: d.temperature_2m_min[i] ?? NaN,
      rainMm: d.precipitation_sum[i] ?? 0,
    }));
    return { days, years: `${firstYear}–${lastYear}` };
  });
}

export async function getStopWeather(stop: Stop): Promise<StopWeather> {
  const today = todayIso();
  const lastForecastDay = addDays(today, FORECAST_DAYS - 1);
  const tripIsClose = stop.startDate <= lastForecastDay; // ISO dates compare lexicographically

  const [history, forecast] = await Promise.all([
    getHistory(stop.lat, stop.lon),
    tripIsClose
      ? getForecast(stop, stop.startDate < today ? today : stop.startDate, stop.endDate > lastForecastDay ? lastForecastDay : stop.endDate)
      : Promise.resolve([]),
  ]);

  const climate = summarizeClimate(history.days, stop.startDate, stop.endDate);
  return {
    mode: forecast.length ? "forecast" : "climate",
    forecast,
    tripTypical: climate.tripTypical,
    months: climate.months,
    bestMonths: climate.bestMonths,
    tripMonthRank: climate.tripMonthRank,
    yearsUsed: history.years,
  };
}
