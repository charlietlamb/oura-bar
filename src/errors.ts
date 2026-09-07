import { Data } from "effect";

export class NotAuthenticated extends Data.TaggedError("NotAuthenticated")<{
  readonly hint: string;
}> {}

export class AuthorizationFailed extends Data.TaggedError(
  "AuthorizationFailed"
)<{
  readonly reason: string;
}> {}
