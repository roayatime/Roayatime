import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Locally bundled SIL-OFL fonts (from @fontsource); no network needed at render time.
export const TITLE_FONT = "Amiri";
export const TEXT_FONT = "Noto Kufi Arabic";

export const fontsLoaded = Promise.all([
  loadFont({ family: TITLE_FONT, url: staticFile("fonts/amiri-arabic-400-normal.woff2"), weight: "400" }),
  loadFont({ family: TITLE_FONT, url: staticFile("fonts/amiri-arabic-700-normal.woff2"), weight: "700" }),
  loadFont({ family: TEXT_FONT, url: staticFile("fonts/noto-kufi-arabic-arabic-400-normal.woff2"), weight: "400" }),
  loadFont({ family: TEXT_FONT, url: staticFile("fonts/noto-kufi-arabic-arabic-600-normal.woff2"), weight: "600" }),
  loadFont({ family: TEXT_FONT, url: staticFile("fonts/noto-kufi-arabic-arabic-800-normal.woff2"), weight: "800" }),
]);
