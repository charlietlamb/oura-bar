import { Option } from "effect";
import {
  clockTime,
  decimal,
  hoursMinutes,
  kilometers,
  percent,
  scoreText,
  signed,
  titleCase,
} from "../menubar/format";
import type { DailyStats } from "../stats/daily-stats";
import {
  type Block,
  type Cell,
  grid,
  progressBar,
  row,
  sectionHeader,
  spacer,
  stack,
  stackedBar,
} from "./blocks";
import { scoreTone, type Theme } from "./theme";

const contributorCells = (
  theme: Theme,
  contributors: Record<string, number | null | undefined>
): Cell[] =>
  Object.entries(contributors).map(([key, value]) => ({
    label: titleCase(key),
    value: scoreText(value),
    dot: scoreTone(theme, value),
  }));

export const sleepSection = (theme: Theme, stats: DailyStats): Block => {
  const night = Option.match(stats.night, {
    onNone: () => [],
    onSome: (night) => [
      grid(theme, [
        {
          label: "Total sleep",
          value: hoursMinutes(night.total_sleep_duration),
        },
        { label: "Efficiency", value: percent(night.efficiency) },
        { label: "In bed", value: hoursMinutes(night.time_in_bed) },
        { label: "Latency", value: hoursMinutes(night.latency) },
      ]),
      row(theme, {
        label: "Bedtime",
        value: `${clockTime(night.bedtime_start)} – ${clockTime(night.bedtime_end)}`,
      }),
      spacer(4),
      stackedBar(theme, [
        { value: night.deep_sleep_duration ?? 0, color: theme.deep },
        { value: night.rem_sleep_duration ?? 0, color: theme.rem },
        { value: night.light_sleep_duration ?? 0, color: theme.light },
        { value: night.awake_time ?? 0, color: theme.awake },
      ]),
      spacer(2),
      grid(theme, [
        {
          label: "Deep",
          value: hoursMinutes(night.deep_sleep_duration),
          dot: theme.deep,
        },
        {
          label: "REM",
          value: hoursMinutes(night.rem_sleep_duration),
          dot: theme.rem,
        },
        {
          label: "Light",
          value: hoursMinutes(night.light_sleep_duration),
          dot: theme.light,
        },
        {
          label: "Awake",
          value: hoursMinutes(night.awake_time),
          dot: theme.awake,
        },
      ]),
    ],
  });
  const contributors = Option.match(stats.sleep, {
    onNone: () => [],
    onSome: (sleep) => [
      spacer(6),
      grid(theme, contributorCells(theme, sleep.contributors)),
    ],
  });
  return stack([sectionHeader(theme, "Sleep"), ...night, ...contributors]);
};

export const readinessSection = (theme: Theme, stats: DailyStats): Block =>
  Option.match(stats.readiness, {
    onNone: () => stack([]),
    onSome: (readiness) =>
      stack([
        sectionHeader(theme, "Readiness"),
        grid(theme, contributorCells(theme, readiness.contributors)),
        spacer(4),
        row(theme, {
          label: "Temperature deviation",
          value: `${signed(readiness.temperature_deviation)} °C`,
        }),
      ]),
  });

export const activitySection = (theme: Theme, stats: DailyStats): Block =>
  Option.match(stats.activity, {
    onNone: () => stack([]),
    onSome: (activity) =>
      stack([
        sectionHeader(theme, "Activity"),
        grid(theme, [
          { label: "Steps", value: activity.steps.toLocaleString() },
          {
            label: "Walking",
            value: kilometers(activity.equivalent_walking_distance),
          },
          {
            label: "Active calories",
            value: `${activity.active_calories} / ${activity.target_calories}`,
          },
          { label: "Total calories", value: String(activity.total_calories) },
        ]),
        spacer(2),
        progressBar(
          theme,
          activity.active_calories / Math.max(activity.target_calories, 1),
          theme.good
        ),
        spacer(4),
        stackedBar(theme, [
          { value: activity.high_activity_time, color: theme.high },
          { value: activity.medium_activity_time, color: theme.medium },
          { value: activity.low_activity_time, color: theme.low },
          { value: activity.sedentary_time, color: theme.sedentary },
        ]),
        spacer(2),
        grid(theme, [
          {
            label: "High",
            value: hoursMinutes(activity.high_activity_time),
            dot: theme.high,
          },
          {
            label: "Medium",
            value: hoursMinutes(activity.medium_activity_time),
            dot: theme.medium,
          },
          {
            label: "Low",
            value: hoursMinutes(activity.low_activity_time),
            dot: theme.low,
          },
          {
            label: "Sedentary",
            value: hoursMinutes(activity.sedentary_time),
            dot: theme.sedentary,
          },
        ]),
        spacer(6),
        grid(theme, contributorCells(theme, activity.contributors)),
      ]),
  });

export const vitalsSection = (theme: Theme, stats: DailyStats): Block => {
  const cells: Cell[] = [];
  Option.map(stats.night, (night) => {
    cells.push(
      { label: "HRV", value: `${scoreText(night.average_hrv)} ms` },
      {
        label: "Lowest HR",
        value: `${scoreText(night.lowest_heart_rate)} bpm`,
      },
      {
        label: "Average HR",
        value: `${decimal(night.average_heart_rate)} bpm`,
      },
      { label: "Breathing", value: `${decimal(night.average_breath)} /min` }
    );
  });
  Option.map(stats.spo2, (spo2) => {
    cells.push(
      { label: "SpO2", value: percent(spo2.spo2_percentage?.average, 1) },
      {
        label: "Disturbances",
        value: scoreText(spo2.breathing_disturbance_index),
      }
    );
  });
  Option.map(stats.stress, (stress) => {
    cells.push(
      {
        label: "Stressed",
        value: hoursMinutes(stress.stress_high),
        dot: theme.high,
      },
      {
        label: "Restored",
        value: hoursMinutes(stress.recovery_high),
        dot: theme.good,
      }
    );
  });
  Option.map(stats.resilience, (resilience) => {
    cells.push({ label: "Resilience", value: titleCase(resilience.level) });
  });
  return cells.length === 0
    ? stack([])
    : stack([sectionHeader(theme, "Vitals"), grid(theme, cells)]);
};
