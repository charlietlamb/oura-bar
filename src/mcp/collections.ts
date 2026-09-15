import type { Schema } from "effect";
import {
  DailyActivity,
  DailyReadiness,
  DailyResilience,
  DailySleep,
  DailySpo2,
  DailyStress,
  SleepPeriod,
} from "../schema/oura";

export const collectionSchemas = {
  daily_readiness: DailyReadiness,
  daily_sleep: DailySleep,
  daily_activity: DailyActivity,
  sleep: SleepPeriod,
  daily_spo2: DailySpo2,
  daily_stress: DailyStress,
  daily_resilience: DailyResilience,
} satisfies Record<string, Schema.Schema.AnyNoContext>;

export type CollectionName = keyof typeof collectionSchemas;

export const collectionNames = Object.keys(collectionSchemas) as [
  CollectionName,
  ...CollectionName[],
];
