import { Config, Context, Duration, Layer, type Redacted } from "effect";

export interface OuraConfigShape {
  readonly clientId: string;
  readonly clientSecret: Redacted.Redacted<string>;
  readonly homeDirectory: string;
  readonly redirectUri: string;
  readonly refreshInterval: Duration.Duration;
  readonly scopes: readonly string[];
}

const whitespace = /\s+/;

export class OuraConfig extends Context.Tag("@oura/OuraConfig")<
  OuraConfig,
  OuraConfigShape
>() {}

export const OuraConfigLive = Layer.effect(
  OuraConfig,
  Config.all({
    clientId: Config.nonEmptyString("OURA_CLIENT_ID"),
    clientSecret: Config.redacted("OURA_CLIENT_SECRET"),
    redirectUri: Config.string("OURA_REDIRECT_URI").pipe(
      Config.withDefault("http://localhost:8484/callback")
    ),
    scopes: Config.string("OURA_SCOPES").pipe(
      Config.withDefault("daily heartrate spo2"),
      Config.map((raw) => raw.split(whitespace).filter(Boolean))
    ),
    refreshInterval: Config.duration("OURA_REFRESH_INTERVAL").pipe(
      Config.withDefault(Duration.minutes(2))
    ),
    homeDirectory: Config.nonEmptyString("HOME"),
  })
);
