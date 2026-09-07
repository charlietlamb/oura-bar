import { Option } from "effect";
import type { DailyStats } from "../stats/daily-stats";
import { divider, spacer, stack } from "./blocks";
import { rings } from "./rings";
import {
  activitySection,
  readinessSection,
  sleepSection,
  vitalsSection,
} from "./sections";
import { cardWidth, document, padding } from "./svg";
import { type Appearance, themes } from "./theme";

const score = (entry: Option.Option<{ readonly score: number | null }>) =>
  Option.getOrNull(Option.flatMap(entry, (x) => Option.fromNullable(x.score)));

export const cardSvg = (stats: DailyStats, appearance: Appearance) => {
  const theme = themes[appearance];
  const sections = [
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
  ].filter((section) => section.height > 0);

  const body = stack([
    spacer(6),
    ...sections.flatMap((section, index) =>
      index === 0 ? [section] : [spacer(8), divider(theme), spacer(2), section]
    ),
    spacer(10),
  ]);
  return document(
    body.height,
    body.render({ x: padding, y: 0, width: cardWidth - padding * 2 })
  );
};
