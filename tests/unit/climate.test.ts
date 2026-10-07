/** Climate statistics and comfort scoring. */
import { describe, it, expect } from "vitest";
import { calendarDays, comfortScore, summarizeClimate, type DayRecord } from "@/lib/climate";

describe("comfortScore", () => {
  it("gives full marks to a perfect dry, mild month", () => {
    expect(comfortScore(24, 15, 0)).toBe(100);
  });
  it("punishes heat, cold nights and rain", () => {
    expect(comfortScore(36, 25, 0)).toBeLessThan(65);
    expect(comfortScore(10, 2, 0)).toBe(51); // 100 − (20−10)×4 − (8−2)×1.5
    expect(comfortScore(24, 15, 60)).toBeLessThan(70);
  });
  it("never goes below 0 or above 100", () => {
    expect(comfortScore(-20, -30, 100)).toBe(0);
  });
});

describe("calendarDays", () => {
  it("lists every day of the trip", () => {
    expect([...calendarDays("2026-10-12", "2026-10-14")]).toEqual(["10-12", "10-13", "10-14"]);
  });
  it("handles trips over New Year", () => {
    expect([...calendarDays("2026-12-30", "2027-01-02")]).toEqual(["12-30", "12-31", "01-01", "01-02"]);
  });
});

describe("summarizeClimate", () => {
  // Fake history: July is hot & dry, January is cold & wet, everything else mild.
  const days: DayRecord[] = [];
  for (const year of [2023, 2024]) {
    for (let m = 1; m <= 12; m++) {
      for (let d = 1; d <= 28; d++) {
        const date = `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        if (m === 7) days.push({ date, tMax: 36, tMin: 24, rainMm: 0 });
        else if (m === 1) days.push({ date, tMax: 8, tMin: 1, rainMm: d % 2 ? 5 : 0 });
        else days.push({ date, tMax: 23, tMin: 14, rainMm: d % 10 === 0 ? 3 : 0 });
      }
    }
  }

  it("averages the trip's calendar dates across years", () => {
    const s = summarizeClimate(days, "2026-01-05", "2026-01-08");
    expect(s.tripTypical?.tMax).toBe(8);
    expect(s.tripTypical?.rainyDaysPct).toBe(50);
  });
  it("ranks a cold wet month near the bottom and never picks it as best", () => {
    const s = summarizeClimate(days, "2026-01-05", "2026-01-08");
    expect(s.months).toHaveLength(12);
    expect(s.bestMonths).not.toContain(1);
    expect(s.bestMonths).not.toContain(7);
    expect(s.tripMonthRank).toBe(12);
  });
});
