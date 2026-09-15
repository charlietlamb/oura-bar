import { Clock, Effect, Option, Schema } from "effect";
import { OuraApi } from "../api/oura-api";
import { TokenStore } from "../auth/token-store";
import { OuraStats } from "../stats/oura-stats";
import {
  type CollectionName,
  collectionNames,
  collectionSchemas,
} from "./collections";
import { statsToJson } from "./stats-json";
import { toolInput } from "./tool-input";

const isoDate = Schema.String.pipe(
  Schema.pattern(/^\d{4}-\d{2}-\d{2}$/, {
    message: () => "expected YYYY-MM-DD",
  })
);

export const CollectionInput = Schema.Struct({
  collection: Schema.Literal(...collectionNames).annotations({
    description: "Oura collection to read",
  }),
  start_date: isoDate.annotations({
    description: "inclusive start day, YYYY-MM-DD",
  }),
  end_date: isoDate.annotations({
    description:
      "end day, YYYY-MM-DD. Oura excludes this day for sleep and daily_activity, so pass tomorrow to include today",
  }),
});

export const EmptyInput = Schema.Struct({});

export const today = Effect.gen(function* () {
  const stats = yield* (yield* OuraStats).latest;
  return statsToJson(stats);
}).pipe(Effect.withSpan("Mcp.today"));

export const collection = (input: typeof CollectionInput.Type) =>
  Effect.gen(function* () {
    const api = yield* OuraApi;
    const name: CollectionName = input.collection;
    const schema: Schema.Schema.AnyNoContext = collectionSchemas[name];
    return yield* api.collection(name, schema, {
      startDate: input.start_date,
      endDate: input.end_date,
    });
  }).pipe(Effect.withSpan("Mcp.collection"));

export const status = Effect.gen(function* () {
  const store = yield* TokenStore;
  const tokens = yield* store.read;
  const now = yield* Clock.currentTimeMillis;
  return Option.match(tokens, {
    onNone: () => ({ authenticated: false, hint: "run `bun run auth`" }),
    onSome: (stored) => ({
      authenticated: true,
      scopes: stored.scope ?? null,
      access_token_expires_at: new Date(stored.expiresAt).toISOString(),
      access_token_expired: now >= stored.expiresAt,
      token_path: store.location,
    }),
  });
}).pipe(Effect.withSpan("Mcp.status"));

export const definitions = {
  today: toolInput(EmptyInput),
  collection: toolInput(CollectionInput),
  status: toolInput(EmptyInput),
};
