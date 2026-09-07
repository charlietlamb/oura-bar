import { Option } from "effect";
import type { DailyStats } from "../stats/daily-stats";
import { spacer, stack } from "./blocks";
import { rings } from "./rings";
import {
  activitySection,
  readinessSection,
  sleepSection,
  vitalsSection,
} from "./sections";
import { document } from "./svg";
import { type Appearance, themes } from "./theme";

const score = (entry: Option.Option<{ readonly score: number | null }>) =>
  Option.getOrNull(Option.flatMap(entry, (x) => Option.fromNullable(x.score)));

export const cardSvg = (stats: DailyStats, appearance: Appearance) => {
  const theme = themes[appearance];
  const body = stack([
    spacer(6),
    rings(
      theme,
      { label: "Sleep", score: score(stats.sleep) },
      { label: "Readiness", score: score(stats.readiness) },
      { label: "Activity", score: score(stats.activity) }
    ),
    sleepSection(theme, stats),
    readinessSection(theme, stats),
    activitySection(theme, stats),
    vitalsSection(theme, stats),
    spacer(8),
  ]);
  return document(body.height, body.render(0));
};
