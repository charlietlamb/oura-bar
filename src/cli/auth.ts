import { BunRuntime } from "@effect/platform-bun";
import { Console, Effect } from "effect";
import { OuraAuth } from "../auth/oura-auth";
import { TokenStore } from "../auth/token-store";
import { AppLive } from "../layers/live";

const program = Effect.gen(function* () {
  const auth = yield* OuraAuth;
  const store = yield* TokenStore;
  const tokens = yield* auth.authorize;
  yield* Console.log(`Saved tokens to ${store.location}`);
  yield* Console.log(`Scopes granted: ${tokens.scope ?? "(unreported)"}`);
  yield* Console.log(
    `Access token expires ${new Date(tokens.expiresAt).toLocaleString()}`
  );
});

BunRuntime.runMain(program.pipe(Effect.provide(AppLive)));
