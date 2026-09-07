import { describe, expect, test } from "bun:test";
import { Option, Schema } from "effect";
import { cardSvg } from "../src/card/card";
import { withRetinaDensity } from "../src/card/png";
import {
  hoursMinutes,
  scoreColor,
  shortDay,
  titleCase,
} from "../src/menubar/format";
import { MenuPayloadJson } from "../src/menubar/payload";
import { menuScores, menuTitle } from "../src/menubar/title";
import type { DailyStats } from "../src/stats/daily-stats";

const empty: DailyStats = {
  day: "2026-09-07",
  readiness: Option.none(),
  sleep: Option.none(),
  activity: Option.none(),
  night: Option.none(),
  spo2: Option.none(),
  stress: Option.none(),
  resilience: Option.none(),
};

const withScores: DailyStats = {
  ...empty,
  readiness: Option.some({
    id: "r",
    day: "2026-09-07",
    score: 84,
    contributors: {
      activity_balance: 90,
      body_temperature: 100,
      hrv_balance: 70,
      previous_day_activity: 80,
      previous_night: 75,
      recovery_index: 88,
      resting_heart_rate: 95,
      sleep_balance: 82,
    },
    temperature_deviation: -0.12,
    temperature_trend_deviation: 0.05,
  }),
  sleep: Option.some({
    id: "s",
    day: "2026-09-07",
    score: 79,
    contributors: {
      deep_sleep: 60,
      efficiency: 90,
      latency: 85,
      rem_sleep: 70,
      restfulness: 65,
      timing: 95,
      total_sleep: 80,
    },
  }),
};

describe("menuTitle", () => {
  test("carries sleep, readiness, activity in order", () => {
    expect(menuTitle(withScores)).toBe("79 · 84 · --");
    expect(menuTitle(empty)).toBe("-- · -- · --");
  });

  test("exposes individual scores for the host", () => {
    expect(menuScores(withScores)).toEqual({
      readiness: 84,
      sleep: 79,
      activity: null,
    });
  });
});

describe("MenuPayloadJson", () => {
  test("round-trips a payload", () => {
    const encoded = Schema.encodeSync(MenuPayloadJson)({
      title: "84 · 79 · 91",
      card: "AAAA",
      updated: "15:42",
      day: "7 Sep",
    });
    expect(JSON.parse(encoded)).toEqual({
      title: "84 · 79 · 91",
      card: "AAAA",
      updated: "15:42",
      day: "7 Sep",
    });
  });
});

describe("cardSvg", () => {
  test("produces an svg with rings and section labels", () => {
    const svg = cardSvg(withScores, "dark");
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain(">Readiness<");
    expect(svg).toContain(">Sleep<");
    expect(svg).toContain("stroke-dasharray");
  });

  test("light theme uses dark text", () => {
    expect(cardSvg(withScores, "light")).toContain('fill="#1d1d1f"');
  });
});

describe("withRetinaDensity", () => {
  test("inserts a pHYs chunk after IHDR", () => {
    const fakePng = new Uint8Array(8 + 25 + 4).fill(7);
    const out = withRetinaDensity(fakePng);
    expect(out.length).toBe(fakePng.length + 21);
    expect(new TextDecoder().decode(out.subarray(37, 41))).toBe("pHYs");
    expect(out[41 + 8]).toBe(1);
  });
});

describe("format", () => {
  test("hoursMinutes", () => {
    expect(hoursMinutes(25_200)).toBe("7h 00m");
    expect(hoursMinutes(600)).toBe("10m");
    expect(hoursMinutes(null)).toBe("--");
  });

  test("scoreColor thresholds", () => {
    expect(scoreColor(90)).toBe("#34c759");
    expect(scoreColor(72)).toBe("#ff9f0a");
    expect(scoreColor(50)).toBe("#ff453a");
  });

  test("titleCase", () => {
    expect(titleCase("hrv_balance")).toBe("HRV balance");
    expect(titleCase("resting_heart_rate")).toBe("Resting heart rate");
  });

  test("shortDay", () => {
    expect(shortDay("2026-09-06")).toBe("6 Sep");
  });
});
