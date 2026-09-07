import type { Block } from "./blocks";
import { ring, text } from "./svg";
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
  height: 112,
  render: (frame) => {
    const cy = frame.y + 48;
    const labelY = cy + 42 + 8 + 14;
    const spacing = frame.width / 4;
    return [
      drawRing(theme, left, frame.x + spacing, cy, 30, 6, 16, labelY),
      drawRing(theme, center, frame.x + spacing * 2, cy, 42, 8, 22, labelY),
      drawRing(theme, right, frame.x + spacing * 3, cy, 30, 6, 16, labelY),
    ].join("");
  },
});
