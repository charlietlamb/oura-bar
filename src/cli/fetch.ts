import { FileSystem } from "@effect/platform";
import { BunRuntime } from "@effect/platform-bun";
import { Config, Effect, Logger, Option } from "effect";
import { AppLive } from "../layers/live";
import { errorOutput, menuOutput } from "../menubar/output";
import { writeStdout } from "./stdout";

const stderrLogger = Logger.replace(
  Logger.defaultLogger,
  Logger.prettyLogger({ stderr: true })
);

const describe = (error: unknown) =>
  typeof error === "object" && error !== null && "message" in error
    ? String(error.message)
    : String(error);

const deliver = (output: string) =>
  Effect.gen(function* () {
    const target = yield* Config.option(Config.string("OURA_OUTPUT_PATH"));
    if (Option.isNone(target)) {
      return yield* writeStdout(output);
    }
    const fs = yield* FileSystem.FileSystem;
    yield* fs.writeFileString(target.value, output);
  });

const program = menuOutput.pipe(
  Effect.catchAll((error) =>
    Effect.logWarning("oura fetch failed").pipe(
      Effect.annotateLogs({ error: error._tag }),
      Effect.andThen(errorOutput(describe(error)))
    )
  ),
  Effect.flatMap(deliver)
);

BunRuntime.runMain(
  program.pipe(Effect.provide(AppLive), Effect.provide(stderrLogger))
);
