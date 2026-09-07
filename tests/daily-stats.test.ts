import { describe, expect, test } from "bun:test";
import { Option } from "effect";
import type { SleepPeriod } from "../src/schema/oura";
import { dayOf, latestByDay, latestNight } from "../src/stats/daily-stats";

const night = (day: string, type: string): SleepPeriod => ({
  id: `${day}-${type}`,
  day,
  type,
  bedtime_start: `${day}T23:00:00+01:00`,
  bedtime_end: `${day}T07:00:00+01:00`,
  total_sleep_duration: 25_200,
  time_in_bed: 28_800,
  efficiency: 88,
  latency: 600,
  deep_sleep_duration: 5400,
  rem_sleep_duration: 6000,
  light_sleep_duration: 13_800,
  awake_time: 3600,
  average_heart_rate: 52,
  lowest_heart_rate: 46,
  average_hrv: 61,
  average_breath: 14.5,
  restless_periods: 12,
});

describe("latestByDay", () => {
  test("picks the most recent day", () => {
    const latest = latestByDay([
      { day: "2026-09-05" },
      { day: "2026-09-07" },
      { day: "2026-09-06" },
    ]);
    expect(Option.getOrThrow(latest).day).toBe("2026-09-07");
  });

  test("is none for empty input", () => {
    expect(Option.isNone(latestByDay([]))).toBe(true);
  });
});

describe("latestNight", () => {
  test("prefers long sleeps over naps", () => {
    const chosen = latestNight([
      night("2026-09-07", "late_nap"),
      night("2026-09-06", "long_sleep"),
    ]);
    expect(Option.getOrThrow(chosen).type).toBe("long_sleep");
  });

  test("falls back to any period when no long sleep exists", () => {
    const chosen = latestNight([night("2026-09-07", "sleep")]);
    expect(Option.getOrThrow(chosen).day).toBe("2026-09-07");
  });
});

describe("dayOf", () => {
  test("uses the fallback when nothing is present", () => {
    const empty = {
      readiness: Option.none(),
      sleep: Option.none(),
      activity: Option.none(),
      night: Option.none(),
      spo2: Option.none(),
      stress: Option.none(),
      resilience: Option.none(),
    };
    expect(dayOf(empty, "2026-09-07")).toBe("2026-09-07");
  });
});
