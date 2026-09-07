import { DateTime, Effect } from "effect";

export const localClockTime = Effect.gen(function* () {
  const now = yield* DateTime.nowInCurrentZone;
  return DateTime.formatLocal(now, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}).pipe(Effect.provide(DateTime.layerCurrentZoneLocal));
