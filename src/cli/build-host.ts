import { Command, FileSystem, Path } from "@effect/platform";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Console, Data, Duration, Effect } from "effect";
import { OuraConfig, OuraConfigLive } from "../config";

class HostBuildFailed extends Data.TaggedError("HostBuildFailed")<{
  readonly step: string;
  readonly exitCode: number;
}> {}

const appName = "Oura Bar";
const executable = "OuraBar";
const hostSources = ["main.swift", "MenuController.swift", "StatusTitle.swift"];
const runtimeFiles = ["src", "package.json", "bun.lock", ".env"];

const infoPlist = (
  bunPath: string,
  refreshSeconds: number
) => `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleIdentifier</key><string>com.charlielamb.oura-bar</string>
  <key>CFBundleName</key><string>${appName}</string>
  <key>CFBundleExecutable</key><string>${executable}</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>0.1.0</string>
  <key>LSUIElement</key><true/>
  <key>LSMinimumSystemVersion</key><string>13.0</string>
  <key>OuraBunPath</key><string>${bunPath}</string>
  <key>OuraRefreshSeconds</key><real>${refreshSeconds}</real>
</dict>
</plist>
`;

const run = (step: string, command: Command.Command) =>
  Effect.gen(function* () {
    const exitCode = yield* command.pipe(
      Command.stdout("inherit"),
      Command.stderr("inherit"),
      Command.exitCode
    );
    if (exitCode !== 0) {
      return yield* Effect.fail(new HostBuildFailed({ step, exitCode }));
    }
  });

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const config = yield* OuraConfig;
  const projectRoot = path.resolve(import.meta.dir, "..", "..");
  const bundle = path.join(projectRoot, "build", `${appName}.app`);
  const contents = path.join(bundle, "Contents");
  const macos = path.join(contents, "MacOS");
  const runtime = path.join(contents, "Resources", "runtime");

  yield* fs.makeDirectory(macos, { recursive: true });
  yield* fs.makeDirectory(runtime, { recursive: true });

  yield* run(
    "swiftc",
    Command.make(
      "swiftc",
      "-O",
      "-o",
      path.join(macos, executable),
      ...hostSources.map((name) => path.join(projectRoot, "host", name))
    )
  );
  yield* run(
    "rsync runtime",
    Command.make(
      "rsync",
      "-a",
      "--delete",
      ...runtimeFiles.map((name) => path.join(projectRoot, name)),
      `${runtime}/`
    )
  );
  yield* run(
    "bun install",
    Command.make("bun", "install", "--production", "--frozen-lockfile").pipe(
      Command.workingDirectory(runtime)
    )
  );
  yield* fs.writeFileString(
    path.join(contents, "Info.plist"),
    infoPlist(process.execPath, Duration.toSeconds(config.refreshInterval))
  );
  yield* Console.log(`Built ${bundle}`);
});

BunRuntime.runMain(
  program.pipe(Effect.provide(OuraConfigLive), Effect.provide(BunContext.layer))
);
