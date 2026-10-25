import { Font } from "@react-pdf/renderer";

let registered = false;

/**
 * Embed Noto Sans (Vietnamese-capable) for @react-pdf/renderer.
 * Must run in the browser before generating a PDF blob.
 */
export function ensurePdfFonts(): void {
  if (registered) return;
  if (typeof window === "undefined") return;

  const origin = window.location.origin;
  Font.register({
    family: "NotoSans",
    fonts: [
      {
        src: `${origin}/fonts/NotoSans-Regular.ttf`,
        fontWeight: 400,
      },
      {
        src: `${origin}/fonts/NotoSans-Bold.ttf`,
        fontWeight: 700,
      },
    ],
  });
  registered = true;
}
