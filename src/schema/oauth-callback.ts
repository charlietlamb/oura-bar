import { Schema } from "effect";

export const OAuthCallbackParams = Schema.Struct({
  code: Schema.optional(Schema.String),
  state: Schema.optional(Schema.String),
  error: Schema.optional(Schema.String),
  error_description: Schema.optional(Schema.String),
});

export type OAuthCallbackParams = typeof OAuthCallbackParams.Type;
