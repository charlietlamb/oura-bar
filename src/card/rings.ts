import type { Block } from "./blocks";
import { cardWidth, ring, text } from "./svg";
import { scoreTone, type Theme } from "./theme";

export interface RingSpec {
  readonly label: string;
  readonly score: number | null | undefined;
}

const scoreLabel = (score: number | null | undefined) =>
  score === null || score === undefined ? "--" : String(score);

const drawRing = (
  theme: Theme,
  spec: RingSpec,
  cx: number,
  cy: number,
  radius: number,
  stroke: number,
  fontSize: number,
  labelY: number
) =>
  [
    ring(
      cx,
      cy,
      radius,
      stroke,
      (spec.score ?? 0) / 100,
      scoreTone(theme, spec.score),
      theme.track
    ),
    text(cx, cy + fontSize * 0.36, scoreLabel(spec.score), {
      size: fontSize,
      weight: 600,
      fill: theme.text,
      anchor: "middle",
    }),
    text(cx, labelY, spec.label, {
      size: 11,
      fill: theme.muted,
      anchor: "middle",
    }),
  ].join("");

export const rings = (
  theme: Theme,
  left: RingSpec,
  center: RingSpec,
  right: RingSpec
): Block => ({
  height: 132,
  render: (y) => {
    const cy = y + 58;
    const labelY = cy + 42 + 8 + 14;
    const spacing = cardWidth / 4;
    return [
      drawRing(theme, left, spacing, cy, 30, 6, 16, labelY),
      drawRing(theme, center, spacing * 2, cy, 42, 8, 22, labelY),
      drawRing(theme, right, spacing * 3, cy, 30, 6, 16, labelY),
    ].join("");
  },
});
