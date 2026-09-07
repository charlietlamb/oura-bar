import { Schema } from "effect";

const Score = Schema.NullOr(Schema.Number);
const Contributors = <Fields extends Schema.Struct.Fields>(fields: Fields) =>
  Schema.Struct(fields);

export const ReadinessContributors = Contributors({
  activity_balance: Score,
  body_temperature: Score,
  hrv_balance: Score,
  previous_day_activity: Score,
  previous_night: Score,
  recovery_index: Score,
  resting_heart_rate: Score,
  sleep_balance: Score,
  sleep_regularity: Schema.optional(Score),
});

export const DailyReadiness = Schema.Struct({
  id: Schema.String,
  day: Schema.String,
  score: Score,
  contributors: ReadinessContributors,
  temperature_deviation: Schema.NullOr(Schema.Number),
  temperature_trend_deviation: Schema.NullOr(Schema.Number),
});

export type DailyReadiness = typeof DailyReadiness.Type;

export const SleepContributors = Contributors({
  deep_sleep: Score,
  efficiency: Score,
  latency: Score,
  rem_sleep: Score,
  restfulness: Score,
  timing: Score,
  total_sleep: Score,
});

export const DailySleep = Schema.Struct({
  id: Schema.String,
  day: Schema.String,
  score: Score,
  contributors: SleepContributors,
});

export type DailySleep = typeof DailySleep.Type;

export const ActivityContributors = Contributors({
  meet_daily_targets: Score,
  move_every_hour: Score,
  recovery_time: Score,
  stay_active: Score,
  training_frequency: Score,
  training_volume: Score,
});

export const DailyActivity = Schema.Struct({
  id: Schema.String,
  day: Schema.String,
  score: Score,
  contributors: ActivityContributors,
  steps: Schema.Number,
  active_calories: Schema.Number,
  total_calories: Schema.Number,
  target_calories: Schema.Number,
  equivalent_walking_distance: Schema.Number,
  high_activity_time: Schema.Number,
  medium_activity_time: Schema.Number,
  low_activity_time: Schema.Number,
  sedentary_time: Schema.Number,
  resting_time: Schema.Number,
  non_wear_time: Schema.Number,
  inactivity_alerts: Schema.Number,
});

export type DailyActivity = typeof DailyActivity.Type;

export const SleepPeriod = Schema.Struct({
  id: Schema.String,
  day: Schema.String,
  type: Schema.String,
  bedtime_start: Schema.String,
  bedtime_end: Schema.String,
  total_sleep_duration: Schema.NullOr(Schema.Number),
  time_in_bed: Schema.Number,
  efficiency: Schema.NullOr(Schema.Number),
  latency: Schema.NullOr(Schema.Number),
  deep_sleep_duration: Schema.NullOr(Schema.Number),
  rem_sleep_duration: Schema.NullOr(Schema.Number),
  light_sleep_duration: Schema.NullOr(Schema.Number),
  awake_time: Schema.NullOr(Schema.Number),
  average_heart_rate: Schema.NullOr(Schema.Number),
  lowest_heart_rate: Schema.NullOr(Schema.Number),
  average_hrv: Schema.NullOr(Schema.Number),
  average_breath: Schema.NullOr(Schema.Number),
  restless_periods: Schema.NullOr(Schema.Number),
});

export type SleepPeriod = typeof SleepPeriod.Type;

export const DailySpo2 = Schema.Struct({
  id: Schema.String,
  day: Schema.String,
  spo2_percentage: Schema.NullOr(Schema.Struct({ average: Schema.Number })),
  breathing_disturbance_index: Schema.optional(Schema.NullOr(Schema.Number)),
});

export type DailySpo2 = typeof DailySpo2.Type;

export const DailyStress = Schema.Struct({
  id: Schema.String,
  day: Schema.String,
  stress_high: Schema.NullOr(Schema.Number),
  recovery_high: Schema.NullOr(Schema.Number),
  day_summary: Schema.NullOr(Schema.String),
});

export type DailyStress = typeof DailyStress.Type;

export const DailyResilience = Schema.Struct({
  id: Schema.String,
  day: Schema.String,
  level: Schema.String,
  contributors: Contributors({
    sleep_recovery: Score,
    daytime_recovery: Score,
    stress: Score,
  }),
});

export type DailyResilience = typeof DailyResilience.Type;

export const Collection = <A, I, R>(item: Schema.Schema<A, I, R>) =>
  Schema.Struct({
    data: Schema.Array(item),
    next_token: Schema.NullOr(Schema.String),
  });
