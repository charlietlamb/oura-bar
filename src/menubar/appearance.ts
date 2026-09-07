import { Config } from "effect";
import type { Appearance } from "../card/theme";

export const appearanceConfig = Config.string("OS_APPEARANCE").pipe(
  Config.withDefault("Dark"),
  Config.map(
    (raw): Appearance => (raw.toLowerCase() === "light" ? "light" : "dark")
  )
);
