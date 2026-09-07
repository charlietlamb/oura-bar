import { Option } from "effect";
import type { DailyStats } from "../stats/daily-stats";
import { scoreText } from "./format";
import type { MenuScores } from "./payload";

const score = (entry: Option.Option<{ readonly score: number | null }>) =>
  Option.getOrNull(Option.flatMap(entry, (x) => Option.fromNullable(x.score)));

export const menuScores = (stats: DailyStats): typeof MenuScores.Type => ({
  readiness: score(stats.readiness),
  sleep: score(stats.sleep),
  activity: score(stats.activity),
});

export const menuTitle = (stats: DailyStats) => {
  const scores = menuScores(stats);
  return `${scoreText(scores.sleep)} · ${scoreText(scores.readiness)} · ${scoreText(scores.activity)}`;
};
