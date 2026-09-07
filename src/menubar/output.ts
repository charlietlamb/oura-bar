import { Effect, Schema } from "effect";
import { cardSvg } from "../card/card";
import { svgToPngBase64 } from "../card/png";
import { OuraStats } from "../stats/oura-stats";
import { appearanceConfig } from "./appearance";
import { shortDay } from "./format";
import { localClockTime } from "./now";
import { type MenuPayload, MenuPayloadJson } from "./payload";
import { menuScores, menuTitle } from "./title";

const encode = Schema.encode(MenuPayloadJson);

export const menuOutput = Effect.gen(function* () {
  const stats = yield* (yield* OuraStats).latest;
  const appearance = yield* appearanceConfig;
  const card = yield* svgToPngBase64(cardSvg(stats, appearance));
  const updated = yield* localClockTime;
  const payload: MenuPayload = {
    title: menuTitle(stats),
    scores: menuScores(stats),
    card,
    updated,
    day: shortDay(stats.day),
  };
  return yield* encode(payload);
}).pipe(Effect.withSpan("Menu.output"));

export const errorOutput = (message: string) =>
  Effect.gen(function* () {
    const updated = yield* localClockTime;
    const payload: MenuPayload = { title: "Oura", updated, error: message };
    return yield* encode(payload);
  });
