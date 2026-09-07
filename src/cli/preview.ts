import { FileSystem } from "@effect/platform";
import { BunRuntime } from "@effect/platform-bun";
import { Config, Console, Effect } from "effect";
import { cardSvg } from "../card/card";
import { svgToPngBase64 } from "../card/png";
import { AppLive } from "../layers/live";
import { appearanceConfig } from "../menubar/appearance";
import { OuraStats } from "../stats/oura-stats";

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const target = yield* Config.string("OURA_PREVIEW_PATH").pipe(
    Config.withDefault("preview.png")
  );
  const stats = yield* (yield* OuraStats).latest;
  const appearance = yield* appearanceConfig;
  const png = yield* svgToPngBase64(cardSvg(stats, appearance));
  yield* fs.writeFile(target, Buffer.from(png, "base64"));
  yield* Console.log(`Wrote ${target}`);
});

BunRuntime.runMain(program.pipe(Effect.provide(AppLive)));
