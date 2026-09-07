import { Command, type CommandExecutor } from "@effect/platform";
import type { PlatformError } from "@effect/platform/Error";
import {
  Clock,
  Context,
  Duration,
  Effect,
  Layer,
  Option,
  type ParseResult,
  type Redacted,
} from "effect";
import { OuraConfig } from "../config";
import { type AuthorizationFailed, NotAuthenticated } from "../errors";
import type { StoredTokens, TokenResponse } from "../schema/tokens";
import { awaitAuthorizationCode } from "./callback-server";
import { OAuthClient, type OAuthClientError } from "./oauth-client";
import { AUTHORIZE_URL } from "./oauth-endpoints";
import { TokenStore } from "./token-store";

export type AuthError =
  | NotAuthenticated
  | OAuthClientError
  | PlatformError
  | ParseResult.ParseError;

export interface OuraAuthShape {
  readonly accessToken: Effect.Effect<Redacted.Redacted<string>, AuthError>;
  readonly authorize: Effect.Effect<
    StoredTokens,
    AuthorizationFailed | AuthError,
    CommandExecutor.CommandExecutor
  >;
  readonly refresh: Effect.Effect<Redacted.Redacted<string>, AuthError>;
}

export class OuraAuth extends Context.Tag("@oura/OuraAuth")<
  OuraAuth,
  OuraAuthShape
>() {}

const expiryBuffer = Duration.toMillis("60 seconds");

const authorizeUrl = (config: OuraConfig["Type"], state: string): string => {
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("scope", config.scopes.join(" "));
  url.searchParams.set("state", state);
  return url.toString();
};

const persistedFrom = (response: TokenResponse, now: number): StoredTokens => ({
  accessToken: response.access_token,
  refreshToken: response.refresh_token,
  expiresAt: now + response.expires_in * 1000,
  ...(response.scope === undefined ? {} : { scope: response.scope }),
});

export const OuraAuthLive = Layer.effect(
  OuraAuth,
  Effect.gen(function* () {
    const config = yield* OuraConfig;
    const store = yield* TokenStore;
    const oauth = yield* OAuthClient;
    const refreshLock = yield* Effect.makeSemaphore(1);

    const persist = (response: TokenResponse) =>
      Effect.gen(function* () {
        const now = yield* Clock.currentTimeMillis;
        const tokens = persistedFrom(response, now);
        yield* store.write(tokens);
        return tokens;
      });

    const stored = Effect.gen(function* () {
      const tokens = yield* store.read;
      return yield* Option.match(tokens, {
        onNone: () =>
          Effect.fail(
            new NotAuthenticated({ hint: "run `bun run auth` first" })
          ),
        onSome: Effect.succeed,
      });
    });

    const refresh = refreshLock
      .withPermits(1)(
        Effect.gen(function* () {
          const current = yield* stored;
          const next = yield* oauth.refresh(current.refreshToken);
          const tokens = yield* persist(next);
          yield* Effect.logInfo("oura tokens refreshed");
          return tokens.accessToken;
        })
      )
      .pipe(Effect.withSpan("OuraAuth.refresh"));

    const accessToken = Effect.gen(function* () {
      const tokens = yield* stored;
      const now = yield* Clock.currentTimeMillis;
      if (now + expiryBuffer >= tokens.expiresAt) {
        return yield* refresh;
      }
      return tokens.accessToken;
    }).pipe(Effect.withSpan("OuraAuth.accessToken"));

    const authorize = Effect.gen(function* () {
      const state = yield* Effect.sync(() => crypto.randomUUID());
      const url = authorizeUrl(config, state);
      yield* Effect.logInfo("opening browser for oura consent").pipe(
        Effect.annotateLogs({ url })
      );
      const code = yield* awaitAuthorizationCode(
        config.redirectUri,
        state
      ).pipe(
        Effect.zipLeft(Command.make("open", url).pipe(Command.exitCode), {
          concurrent: true,
        })
      );
      const response = yield* oauth.exchangeCode(code);
      return yield* persist(response);
    }).pipe(Effect.withSpan("OuraAuth.authorize"));

    return OuraAuth.of({ authorize, accessToken, refresh });
  })
);
