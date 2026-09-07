import { FetchHttpClient } from "@effect/platform";
import { BunContext } from "@effect/platform-bun";
import { Layer } from "effect";
import { OuraApiLive } from "../api/oura-api";
import { OAuthClientLive } from "../auth/oauth-client";
import { OuraAuthLive } from "../auth/oura-auth";
import { TokenStoreLive } from "../auth/token-store";
import { OuraConfigLive } from "../config";
import { OuraStatsLive } from "../stats/oura-stats";

const PlatformLive = Layer.mergeAll(BunContext.layer, FetchHttpClient.layer);

const AuthLive = OuraAuthLive.pipe(
  Layer.provideMerge(Layer.mergeAll(TokenStoreLive, OAuthClientLive)),
  Layer.provideMerge(OuraConfigLive),
  Layer.provideMerge(PlatformLive)
);

export const AppLive = OuraStatsLive.pipe(
  Layer.provide(OuraApiLive),
  Layer.provideMerge(AuthLive)
);
