import {
  HttpRouter,
  HttpServer,
  HttpServerRequest,
  HttpServerResponse,
} from "@effect/platform";
import { BunHttpServer } from "@effect/platform-bun";
import { Deferred, Effect, Layer } from "effect";
import { AuthorizationFailed } from "../errors";
import { OAuthCallbackParams } from "../schema/oauth-callback";

const successPage =
  '<!doctype html><body style="font-family:-apple-system;padding:40px"><h2>Oura connected</h2><p>You can close this tab.</p></body>';

const failurePage = (reason: string) =>
  `<!doctype html><body style="font-family:-apple-system;padding:40px"><h2>Oura authorization failed</h2><p>${reason}</p></body>`;

const outcome = (
  params: OAuthCallbackParams,
  expectedState: string
): Effect.Effect<string, AuthorizationFailed> => {
  if (params.error) {
    return Effect.fail(
      new AuthorizationFailed({
        reason: params.error_description ?? params.error,
      })
    );
  }
  if (params.state !== expectedState) {
    return Effect.fail(new AuthorizationFailed({ reason: "state mismatch" }));
  }
  if (!params.code) {
    return Effect.fail(
      new AuthorizationFailed({ reason: "callback missing code" })
    );
  }
  return Effect.succeed(params.code);
};

export const awaitAuthorizationCode = (
  redirectUri: string,
  expectedState: string
) =>
  Effect.gen(function* () {
    const url = new URL(redirectUri);
    const received = yield* Deferred.make<string, AuthorizationFailed>();

    const handler = Effect.gen(function* () {
      const params =
        yield* HttpServerRequest.schemaSearchParams(OAuthCallbackParams);
      const result = yield* outcome(params, expectedState).pipe(Effect.either);
      yield* Deferred.complete(received, result);
      return result._tag === "Right"
        ? HttpServerResponse.html(successPage)
        : HttpServerResponse.html(failurePage(result.left.reason));
    });

    const router = HttpRouter.empty.pipe(
      HttpRouter.get(url.pathname as `/${string}`, handler),
      HttpRouter.catchAll(() =>
        HttpServerResponse.text("bad callback", { status: 400 })
      )
    );

    yield* HttpServer.serve(router).pipe(
      Layer.provide(
        BunHttpServer.layer({ port: Number(url.port), hostname: url.hostname })
      ),
      Layer.launch,
      Effect.forkScoped
    );

    return yield* Deferred.await(received);
  }).pipe(Effect.scoped, Effect.withSpan("CallbackServer.await"));
