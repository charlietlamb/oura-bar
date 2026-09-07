import { circle, rect, text } from "./svg";
import { scoreTone, type Theme } from "./theme";

export interface Frame {
  readonly width: number;
  readonly x: number;
  readonly y: number;
}

export interface Block {
  readonly height: number;
  readonly render: (frame: Frame) => string;
}

export const rowHeight = 19;
const labelSize = 12;
const valueSize = 12;

export const stack = (blocks: readonly Block[]): Block => ({
  height: blocks.reduce((total, block) => total + block.height, 0),
  render: (frame) => {
    let cursor = frame.y;
    return blocks
      .map((block) => {
        const rendered = block.render({ ...frame, y: cursor });
        cursor += block.height;
        return rendered;
      })
      .join("");
  },
});

export const spacer = (height: number): Block => ({ height, render: () => "" });

export const divider = (theme: Theme): Block => ({
  height: 1,
  render: (frame) => rect(frame.x, frame.y, frame.width, 1, theme.rule),
});

export const sectionTitle = (theme: Theme, title: string): Block => ({
  height: 26,
  render: (frame) =>
    text(frame.x, frame.y + 17, title, {
      size: 11,
      weight: 600,
      fill: theme.muted,
      tracking: 0.3,
    }),
});

export interface Cell {
  readonly dot?: string;
  readonly label: string;
  readonly value: string;
}

const cell = (
  theme: Theme,
  entry: Cell,
  x: number,
  width: number,
  y: number
) => {
  const baseline = y + 14;
  const labelX = entry.dot ? x + 14 : x;
  return [
    entry.dot ? circle(x + 4, baseline - 4, 4, entry.dot) : "",
    text(labelX, baseline, entry.label, { size: labelSize, fill: theme.text }),
    text(x + width, baseline, entry.value, {
      size: valueSize,
      weight: 600,
      fill: theme.text,
      anchor: "end",
    }),
  ].join("");
};

export const row = (theme: Theme, entry: Cell): Block => ({
  height: rowHeight,
  render: (frame) => cell(theme, entry, frame.x, frame.width, frame.y),
});

const columnGap = 20;

export const grid = (theme: Theme, entries: readonly Cell[]): Block => {
  const rows = Math.ceil(entries.length / 2);
  return {
    height: rows * rowHeight,
    render: (frame) => {
      const width = (frame.width - columnGap) / 2;
      return entries
        .map((entry, index) => {
          const column = index % 2;
          const rowIndex = Math.floor(index / 2);
          const x = frame.x + column * (width + columnGap);
          return cell(theme, entry, x, width, frame.y + rowIndex * rowHeight);
        })
        .join("");
    },
  };
};

export interface Segment {
  readonly color: string;
  readonly value: number;
}

const barThickness = 12;

export const stackedBar = (
  theme: Theme,
  segments: readonly Segment[]
): Block => ({
  height: barThickness + 6,
  render: (frame) => {
    const total = segments.reduce((sum, segment) => sum + segment.value, 0);
    const barY = frame.y + 3;
    const radius = barThickness / 2;
    if (total <= 0) {
      return rect(
        frame.x,
        barY,
        frame.width,
        barThickness,
        theme.track,
        radius
      );
    }
    let x = frame.x;
    const pieces = segments.map((segment) => {
      const width = (segment.value / total) * frame.width;
      const piece = rect(x, barY, width, barThickness, segment.color);
      x += width;
      return piece;
    });
    const clipId = `bar${Math.round(frame.y)}`;
    return `<clipPath id="${clipId}"><rect x="${frame.x}" y="${barY}" width="${frame.width}" height="${barThickness}" rx="${radius}"/></clipPath><g clip-path="url(#${clipId})">${pieces.join("")}</g>`;
  },
});

export const progressBar = (
  theme: Theme,
  fraction: number,
  color: string
): Block => ({
  height: 14,
  render: (frame) =>
    [
      rect(frame.x, frame.y + 3, frame.width, 8, theme.track, 4),
      rect(
        frame.x,
        frame.y + 3,
        frame.width * Math.min(Math.max(fraction, 0), 1),
        8,
        color,
        4
      ),
    ].join(""),
});

export interface BarItem {
  readonly label: string;
  readonly value: number | null | undefined;
}

const chartHeight = 40;
const chartValueSize = 10;
const chartLabelSize = 9;

export const barChart = (theme: Theme, items: readonly BarItem[]): Block => ({
  height: chartValueSize + 4 + chartHeight + 4 + chartLabelSize + 6,
  render: (frame) => {
    const slot = frame.width / items.length;
    const barWidth = Math.min(14, slot * 0.4);
    const top = frame.y + chartValueSize + 4;
    const bottom = top + chartHeight;
    return items
      .map((item, index) => {
        const cx = frame.x + slot * index + slot / 2;
        const x = cx - barWidth / 2;
        const fraction = Math.min(Math.max((item.value ?? 0) / 100, 0), 1);
        const filled = Math.max(
          fraction * chartHeight,
          fraction > 0 ? barWidth / 2 : 0
        );
        return [
          rect(x, top, barWidth, chartHeight, theme.track, barWidth / 2),
          rect(
            x,
            bottom - filled,
            barWidth,
            filled,
            scoreTone(theme, item.value),
            barWidth / 2
          ),
          text(
            cx,
            top - 4,
            item.value === null || item.value === undefined
              ? "--"
              : String(item.value),
            {
              size: chartValueSize,
              weight: 600,
              fill: theme.text,
              anchor: "middle",
            }
          ),
          text(cx, bottom + 4 + chartLabelSize, item.label, {
            size: chartLabelSize,
            fill: theme.muted,
            anchor: "middle",
          }),
        ].join("");
      })
      .join("");
  },
});
