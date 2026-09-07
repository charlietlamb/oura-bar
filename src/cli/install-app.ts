import { Command, Path } from "@effect/platform";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Config, Console, Data, Effect } from "effect";

class InstallFailed extends Data.TaggedError("InstallFailed")<{
  readonly exitCode: number;
}> {}

const appName = "Oura Bar";

const program = Effect.gen(function* () {
  const path = yield* Path.Path;
  const home = yield* Config.nonEmptyString("HOME");
  const source = path.resolve(
    import.meta.dir,
    "..",
    "..",
    "build",
    `${appName}.app`
  );
  const target = path.join(home, "Applications", `${appName}.app`);

  yield* Command.make("mkdir", "-p", path.dirname(target)).pipe(
    Command.exitCode
  );
  const exitCode = yield* Command.make(
    "rsync",
    "-a",
    "--delete",
    `${source}/`,
    `${target}/`
  ).pipe(Command.stderr("inherit"), Command.exitCode);
  if (exitCode !== 0) {
    return yield* Effect.fail(new InstallFailed({ exitCode }));
  }
  yield* Console.log(`Installed ${target}`);
});

BunRuntime.runMain(program.pipe(Effect.provide(BunContext.layer)));
