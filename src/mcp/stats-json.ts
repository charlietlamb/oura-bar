import { Option } from "effect";
import type { DailyStats } from "../stats/daily-stats";

const orNull = <A>(value: Option.Option<A>) => Option.getOrNull(value);

export const statsToJson = (stats: DailyStats) => ({
  day: stats.day,
  readiness: orNull(stats.readiness),
  sleep: orNull(stats.sleep),
  activity: orNull(stats.activity),
  last_night: orNull(stats.night),
  spo2: orNull(stats.spo2),
  stress: orNull(stats.stress),
  resilience: orNull(stats.resilience),
});
