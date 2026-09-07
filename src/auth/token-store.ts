import { FileSystem, Path } from "@effect/platform";
import type { PlatformError } from "@effect/platform/Error";
import {
  Context,
  Effect,
  Layer,
  Option,
  type ParseResult,
  Schema,
} from "effect";
import { OuraConfig } from "../config";
import { type StoredTokens, StoredTokensJson } from "../schema/tokens";

export interface TokenStoreShape {
  readonly location: string;
  readonly read: Effect.Effect<
    Option.Option<StoredTokens>,
    PlatformError | ParseResult.ParseError
  >;
  readonly write: (
    tokens: StoredTokens
  ) => Effect.Effect<void, PlatformError | ParseResult.ParseError>;
}

export class TokenStore extends Context.Tag("@oura/TokenStore")<
  TokenStore,
  TokenStoreShape
>() {}

const ownerOnly = 0o600;

export const TokenStoreLive = Layer.effect(
  TokenStore,
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const config = yield* OuraConfig;

    const directory = path.join(config.homeDirectory, ".config", "oura");
    const location = path.join(directory, "tokens.json");

    const read = Effect.gen(function* () {
      const exists = yield* fs.exists(location);
      if (!exists) {
        return Option.none<StoredTokens>();
      }
      const raw = yield* fs.readFileString(location);
      return Option.some(yield* Schema.decode(StoredTokensJson)(raw));
    }).pipe(Effect.withSpan("TokenStore.read"));

    const write = Effect.fn("TokenStore.write")(function* (
      tokens: StoredTokens
    ) {
      yield* fs.makeDirectory(directory, { recursive: true });
      const encoded = yield* Schema.encode(StoredTokensJson)(tokens);
      yield* fs.writeFileString(location, encoded);
      yield* fs.chmod(location, ownerOnly);
    });

    return TokenStore.of({ read, write, location });
  })
);
