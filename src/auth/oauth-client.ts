import {
  HttpClient,
  type HttpClientError,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform";
import { Context, Effect, Layer, type ParseResult, Redacted } from "effect";
import { OuraConfig } from "../config";
import { TokenResponse } from "../schema/tokens";
import { TOKEN_URL } from "./oauth-endpoints";

export type OAuthClientError =
  | HttpClientError.HttpClientError
  | ParseResult.ParseError;

export interface OAuthClientShape {
  readonly exchangeCode: (
    code: string
  ) => Effect.Effect<TokenResponse, OAuthClientError>;
  readonly refresh: (
    refreshToken: Redacted.Redacted<string>
  ) => Effect.Effect<TokenResponse, OAuthClientError>;
}

export class OAuthClient extends Context.Tag("@oura/OAuthClient")<
  OAuthClient,
  OAuthClientShape
>() {}

export const OAuthClientLive = Layer.effect(
  OAuthClient,
  Effect.gen(function* () {
    const config = yield* OuraConfig;
    const http = (yield* HttpClient.HttpClient).pipe(HttpClient.filterStatusOk);

    const credentials = {
      client_id: config.clientId,
      client_secret: Redacted.value(config.clientSecret),
    };

    const requestToken = (grant: Record<string, string>) =>
      HttpClientRequest.post(TOKEN_URL).pipe(
        HttpClientRequest.bodyUrlParams({ ...credentials, ...grant }),
        http.execute,
        Effect.flatMap(HttpClientResponse.schemaBodyJson(TokenResponse)),
        Effect.scoped
      );

    const exchangeCode = Effect.fn("OAuthClient.exchangeCode")(function* (
      code: string
    ) {
      return yield* requestToken({
        grant_type: "authorization_code",
        code,
        redirect_uri: config.redirectUri,
      });
    });

    const refresh = Effect.fn("OAuthClient.refresh")(function* (
      refreshToken: Redacted.Redacted<string>
    ) {
      return yield* requestToken({
        grant_type: "refresh_token",
        refresh_token: Redacted.value(refreshToken),
      });
    });

    return OAuthClient.of({ exchangeCode, refresh });
  })
);
