import { circle, contentWidth, line, padding, rect, text } from "./svg";
import type { Theme } from "./theme";

export interface Block {
  readonly height: number;
  readonly render: (y: number) => string;
}

export const rowHeight = 19;
const labelSize = 12;
const valueSize = 12;

export const stack = (blocks: readonly Block[]): Block => ({
  height: blocks.reduce((total, block) => total + block.height, 0),
  render: (y) => {
    let cursor = y;
    return blocks
      .map((block) => {
        const rendered = block.render(cursor);
        cursor += block.height;
        return rendered;
      })
      .join("");
  },
});

export const spacer = (height: number): Block => ({ height, render: () => "" });

export const sectionHeader = (theme: Theme, title: string): Block => ({
  height: 30,
  render: (y) => {
    const center = padding + contentWidth / 2;
    const mid = y + 18;
    const gap = title.length * 4 + 14;
    return [
      line(padding, mid, center - gap, mid, theme.rule),
      line(center + gap, mid, padding + contentWidth, mid, theme.rule),
      text(center, mid + 4, title, {
        size: 11,
        weight: 600,
        fill: theme.muted,
        anchor: "middle",
        tracking: 0.6,
      }),
    ].join("");
  },
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
  render: (y) => cell(theme, entry, padding, contentWidth, y),
});

const columnGap = 20;

export const grid = (theme: Theme, entries: readonly Cell[]): Block => {
  const rows = Math.ceil(entries.length / 2);
  const width = (contentWidth - columnGap) / 2;
  return {
    height: rows * rowHeight,
    render: (y) =>
      entries
        .map((entry, index) => {
          const column = index % 2;
          const rowIndex = Math.floor(index / 2);
          const x = padding + column * (width + columnGap);
          return cell(theme, entry, x, width, y + rowIndex * rowHeight);
        })
        .join(""),
  };
};

export interface Segment {
  readonly color: string;
  readonly value: number;
}

export const stackedBar = (
  theme: Theme,
  segments: readonly Segment[]
): Block => ({
  height: 16,
  render: (y) => {
    const total = segments.reduce((sum, segment) => sum + segment.value, 0);
    const barY = y + 4;
    if (total <= 0) {
      return rect(padding, barY, contentWidth, 8, theme.track, 4);
    }
    let x = padding;
    const pieces = segments.map((segment) => {
      const width = (segment.value / total) * contentWidth;
      const piece = rect(x, barY, width, 8, segment.color);
      x += width;
      return piece;
    });
    return `<clipPath id="bar${y}"><rect x="${padding}" y="${barY}" width="${contentWidth}" height="8" rx="4"/></clipPath><g clip-path="url(#bar${y})">${pieces.join("")}</g>`;
  },
});

export const progressBar = (
  theme: Theme,
  fraction: number,
  color: string
): Block => ({
  height: 14,
  render: (y) =>
    [
      rect(padding, y + 3, contentWidth, 6, theme.track, 3),
      rect(
        padding,
        y + 3,
        contentWidth * Math.min(Math.max(fraction, 0), 1),
        6,
        color,
        3
      ),
    ].join(""),
});
