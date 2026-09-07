import { Schema } from "effect";

export const TokenResponse = Schema.Struct({
  access_token: Schema.Redacted(Schema.String),
  refresh_token: Schema.Redacted(Schema.String),
  expires_in: Schema.Number,
  token_type: Schema.optional(Schema.String),
  scope: Schema.optional(Schema.String),
});

export type TokenResponse = typeof TokenResponse.Type;

export const StoredTokens = Schema.Struct({
  accessToken: Schema.Redacted(Schema.String),
  refreshToken: Schema.Redacted(Schema.String),
  expiresAt: Schema.Number,
  scope: Schema.optional(Schema.String),
});

export type StoredTokens = typeof StoredTokens.Type;

export const StoredTokensJson = Schema.parseJson(StoredTokens);
