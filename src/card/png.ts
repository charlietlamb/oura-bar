import { Resvg } from "@resvg/resvg-js";
import { Data, Effect } from "effect";

export class CardRenderFailed extends Data.TaggedError("CardRenderFailed")<{
  readonly cause: unknown;
}> {}

const scale = 2;
const pixelsPerMeter = Math.round((72 * scale) / 0.0254);
const signatureLength = 8;
const ihdrLength = 25;

const chunk = (type: string, data: Uint8Array) => {
  const typeBytes = new TextEncoder().encode(type);
  const body = new Uint8Array(typeBytes.length + data.length);
  body.set(typeBytes);
  body.set(data, typeBytes.length);
  const out = new Uint8Array(4 + body.length + 4);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  out.set(body, 4);
  view.setUint32(4 + body.length, Bun.hash.crc32(body));
  return out;
};

const physChunk = () => {
  const data = new Uint8Array(9);
  const view = new DataView(data.buffer);
  view.setUint32(0, pixelsPerMeter);
  view.setUint32(4, pixelsPerMeter);
  data[8] = 1;
  return chunk("pHYs", data);
};

export const withRetinaDensity = (png: Uint8Array) => {
  const head = png.subarray(0, signatureLength + ihdrLength);
  const rest = png.subarray(signatureLength + ihdrLength);
  const phys = physChunk();
  const out = new Uint8Array(head.length + phys.length + rest.length);
  out.set(head);
  out.set(phys, head.length);
  out.set(rest, head.length + phys.length);
  return out;
};

export const svgToPngBase64 = (svg: string) =>
  Effect.try({
    try: () => {
      const renderer = new Resvg(svg, {
        font: { loadSystemFonts: true },
        fitTo: { mode: "zoom", value: scale },
      });
      const png = renderer.render().asPng();
      return Buffer.from(withRetinaDensity(png)).toString("base64");
    },
    catch: (cause) => new CardRenderFailed({ cause }),
  }).pipe(Effect.withSpan("Card.png"));
