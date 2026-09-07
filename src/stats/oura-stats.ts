import { Context, DateTime, Effect, Layer } from "effect";
import { type DateRange, OuraApi, type OuraApiError } from "../api/oura-api";
import {
  DailyActivity,
  DailyReadiness,
  DailyResilience,
  DailySleep,
  DailySpo2,
  DailyStress,
  SleepPeriod,
} from "../schema/oura";
import {
  type DailyStats,
  dayOf,
  latestByDay,
  latestNight,
} from "./daily-stats";

export interface OuraStatsShape {
  readonly latest: Effect.Effect<DailyStats, OuraApiError>;
}

export class OuraStats extends Context.Tag("@oura/OuraStats")<
  OuraStats,
  OuraStatsShape
>() {}

const lookbackDays = 3;

const isoDate = (date: DateTime.DateTime) => {
  const parts = DateTime.toParts(date);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
};

const recentRange = Effect.gen(function* () {
  const today = yield* DateTime.nowInCurrentZone;
  const range: DateRange = {
    startDate: isoDate(DateTime.subtract(today, { days: lookbackDays })),
    endDate: isoDate(today),
  };
  return range;
});

export const OuraStatsLive = Layer.effect(
  OuraStats,
  Effect.gen(function* () {
    const api = yield* OuraApi;

    const optional = <A>(effect: Effect.Effect<readonly A[], OuraApiError>) =>
      effect.pipe(
        Effect.catchTag("ResponseError", () => Effect.succeed<readonly A[]>([]))
      );

    const latest = Effect.gen(function* () {
      const range = yield* recentRange;
      const [readiness, sleep, activity, nights, spo2, stress, resilience] =
        yield* Effect.all(
          [
            api.collection("daily_readiness", DailyReadiness, range),
            api.collection("daily_sleep", DailySleep, range),
            api.collection("daily_activity", DailyActivity, range),
            api.collection("sleep", SleepPeriod, range),
            optional(api.collection("daily_spo2", DailySpo2, range)),
            optional(api.collection("daily_stress", DailyStress, range)),
            optional(
              api.collection("daily_resilience", DailyResilience, range)
            ),
          ],
          { concurrency: "unbounded" }
        );

      const partial = {
        readiness: latestByDay(readiness),
        sleep: latestByDay(sleep),
        activity: latestByDay(activity),
        night: latestNight(nights),
        spo2: latestByDay(spo2),
        stress: latestByDay(stress),
        resilience: latestByDay(resilience),
      };

      const stats: DailyStats = {
        day: dayOf(partial, range.endDate),
        ...partial,
      };
      return stats;
    }).pipe(
      Effect.withSpan("OuraStats.latest"),
      Effect.provide(DateTime.layerCurrentZoneLocal)
    );

    return OuraStats.of({ latest });
  })
);
