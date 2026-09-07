import { Option } from "effect";
import type {
  DailyActivity,
  DailyReadiness,
  DailyResilience,
  DailySleep,
  DailySpo2,
  DailyStress,
  SleepPeriod,
} from "../schema/oura";

export interface DailyStats {
  readonly activity: Option.Option<DailyActivity>;
  readonly day: string;
  readonly night: Option.Option<SleepPeriod>;
  readonly readiness: Option.Option<DailyReadiness>;
  readonly resilience: Option.Option<DailyResilience>;
  readonly sleep: Option.Option<DailySleep>;
  readonly spo2: Option.Option<DailySpo2>;
  readonly stress: Option.Option<DailyStress>;
}

interface Dated {
  readonly day: string;
}

export const latestByDay = <A extends Dated>(
  records: readonly A[]
): Option.Option<A> =>
  records.reduce<Option.Option<A>>(
    (best, record) =>
      Option.isNone(best) || record.day > best.value.day
        ? Option.some(record)
        : best,
    Option.none()
  );

export const latestNight = (
  periods: readonly SleepPeriod[]
): Option.Option<SleepPeriod> => {
  const longSleeps = periods.filter((period) => period.type === "long_sleep");
  return latestByDay(longSleeps.length > 0 ? longSleeps : periods);
};

export const dayOf = (stats: Omit<DailyStats, "day">, fallback: string) =>
  Option.getOrElse(
    Option.orElse(
      Option.map(stats.readiness, (r) => r.day),
      () => Option.map(stats.sleep, (s) => s.day)
    ),
    () => fallback
  );
