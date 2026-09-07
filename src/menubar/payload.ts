import { Schema } from "effect";

const Score = Schema.NullOr(Schema.Number);

export const MenuScores = Schema.Struct({
  readiness: Score,
  sleep: Score,
  activity: Score,
});

export const MenuPayload = Schema.Struct({
  title: Schema.String,
  scores: Schema.optional(MenuScores),
  card: Schema.optional(Schema.String),
  updated: Schema.String,
  day: Schema.optional(Schema.String),
  error: Schema.optional(Schema.String),
});

export type MenuPayload = typeof MenuPayload.Type;

export const MenuPayloadJson = Schema.parseJson(MenuPayload);
