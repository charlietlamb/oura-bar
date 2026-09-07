export const fontFamily =
  "SF Pro Text, SF Pro, -apple-system, Helvetica Neue, Helvetica, Arial";

export const cardWidth = 360;
export const padding = 16;

const escapeXml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

export interface TextStyle {
  readonly anchor?: "start" | "middle" | "end";
  readonly fill: string;
  readonly size?: number;
  readonly tracking?: number;
  readonly weight?: number;
}

export const text = (x: number, y: number, value: string, style: TextStyle) =>
  `<text x="${x}" y="${y}" font-family="${fontFamily}" font-size="${style.size ?? 12}" font-weight="${style.weight ?? 400}" fill="${style.fill}" text-anchor="${style.anchor ?? "start"}"${style.tracking ? ` letter-spacing="${style.tracking}"` : ""}>${escapeXml(value)}</text>`;

export const rect = (
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  radius = 0
) =>
  `<rect x="${x}" y="${y}" width="${Math.max(width, 0)}" height="${height}" rx="${radius}" fill="${fill}"/>`;

export const circle = (cx: number, cy: number, r: number, fill: string) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;

export const ring = (
  cx: number,
  cy: number,
  r: number,
  strokeWidth: number,
  fraction: number,
  color: string,
  track: string
) => {
  const circumference = 2 * Math.PI * r;
  const visible = Math.min(Math.max(fraction, 0), 1) * circumference;
  return [
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${track}" stroke-width="${strokeWidth}"/>`,
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-dasharray="${visible} ${circumference}" transform="rotate(-90 ${cx} ${cy})"/>`,
  ].join("");
};

export const document = (height: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${cardWidth}" height="${height}" viewBox="0 0 ${cardWidth} ${height}">${body}</svg>`;
