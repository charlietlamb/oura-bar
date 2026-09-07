import {
  HttpClient,
  type HttpClientError,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform";
import {
  Context,
  Effect,
  Layer,
  type ParseResult,
  Redacted,
  Schedule,
  type Schema,
} from "effect";
import { API_BASE_URL } from "../auth/oauth-endpoints";
import { type AuthError, OuraAuth } from "../auth/oura-auth";
import { Collection } from "../schema/oura";

export type OuraApiError =
  | AuthError
  | HttpClientError.HttpClientError
  | ParseResult.ParseError;

export interface DateRange {
  readonly endDate: string;
  readonly startDate: string;
}

export interface OuraApiShape {
  readonly collection: <A, I>(
    name: string,
    item: Schema.Schema<A, I, never>,
    range: DateRange
  ) => Effect.Effect<readonly A[], OuraApiError>;
}

export class OuraApi extends Context.Tag("@oura/OuraApi")<
  OuraApi,
  OuraApiShape
>() {}

const transientRetry = Schedule.exponential("300 millis").pipe(
  Schedule.intersect(Schedule.recurs(3))
);

export const OuraApiLive = Layer.effect(
  OuraApi,
  Effect.gen(function* () {
    const auth = yield* OuraAuth;
    const http = (yield* HttpClient.HttpClient).pipe(
      HttpClient.filterStatusOk,
      HttpClient.retryTransient({ schedule: transientRetry })
    );

    const collection = Effect.fn("OuraApi.collection")(function* <A, I>(
      name: string,
      item: Schema.Schema<A, I, never>,
      range: DateRange
    ) {
      const token = yield* auth.accessToken;
      const page = yield* HttpClientRequest.get(`${API_BASE_URL}/${name}`).pipe(
        HttpClientRequest.setUrlParams({
          start_date: range.startDate,
          end_date: range.endDate,
        }),
        HttpClientRequest.bearerToken(Redacted.value(token)),
        http.execute,
        Effect.flatMap(HttpClientResponse.schemaBodyJson(Collection(item))),
        Effect.scoped,
        Effect.annotateLogs({ collection: name, ...range })
      );
      return page.data;
    });

    return OuraApi.of({ collection });
  })
);
