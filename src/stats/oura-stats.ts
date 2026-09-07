import { Context, DateTime, Effect, Layer } from "effect";
import { OuraApi, type OuraApiError } from "../api/oura-api";
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
import { recentRange, todayIso } from "./date-range";

export interface OuraStatsShape {
  readonly latest: Effect.Effect<DailyStats, OuraApiError>;
}

export class OuraStats extends Context.Tag("@oura/OuraStats")<
  OuraStats,
  OuraStatsShape
>() {}

const currentRange = Effect.gen(function* () {
  const today = yield* DateTime.nowInCurrentZone;
  return { range: recentRange(today), today: todayIso(today) };
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
      const { range, today } = yield* currentRange;
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
        day: dayOf(partial, today),
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
