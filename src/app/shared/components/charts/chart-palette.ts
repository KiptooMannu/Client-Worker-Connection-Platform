/**
 * Validated categorical palettes for every chart in the app.
 *
 * These are not taste choices — they were run through the palette validator
 * against this app's actual chart surface (`#ffffff`, the white card background)
 * and only passing orderings were kept. Do not reorder or extend these arrays
 * without re-validating; slot order is the colour-blind-safety mechanism, not
 * decoration.
 *
 * Validator results (light mode, surface #ffffff, OKLab ΔE ×100):
 *
 *  SERIES_PALETTE — 8 slots, *adjacent* pairlist (line / bar / area / stacked):
 *    lightness band PASS · chroma floor PASS
 *    CVD separation PASS  — worst adjacent #eda100↔#1baf7a ΔE 9.1 (protan)
 *    normal-vision   PASS — worst adjacent #e87ba4↔#eda100 ΔE 19.6
 *
 *  SLICE_PALETTE — 4 slots, *all-pairs* pairlist (pie / donut, where any slice
 *  can sit beside any other):
 *    CVD separation PASS  — worst pair #1baf7a↔#eb6834 ΔE 9.2 (deutan)
 *    normal-vision   PASS — worst pair #4a3aa7↔#2a78d6 ΔE 16.3
 *
 * The 4-slice cap is a hard limit, not a preference: no 5-colour ordering drawn
 * from these ramps clears the all-pairs floors (adding yellow puts it beside
 * orange at ΔE 13.7; green collides with orange at ΔE 3.2 protan; red collides
 * with orange at ΔE 7.1). Past four categories the backend folds the tail into
 * an "Other" slice rather than inventing a fifth hue.
 *
 * Contrast caveat (the "relief rule"): aqua `#1baf7a` (2.82:1), yellow
 * `#eda100` (2.17:1) and magenta `#e87ba4` (2.69:1) sit below 3:1 on white.
 * Charts using those slots must carry visible labels or a table view so colour
 * is never the only channel — which is why the dashboard's pie/donut charts
 * render value labels and a legend rather than relying on the swatch alone.
 */

/** Categorical slots for time-series and bar charts. Fixed order, never cycled. */
export const SERIES_PALETTE = [
  '#2a78d6', // 1 blue
  '#eb6834', // 2 orange
  '#1baf7a', // 3 aqua
  '#eda100', // 4 yellow
  '#e87ba4', // 5 magenta
  '#008300', // 6 green
  '#4a3aa7', // 7 violet
  '#e34948'  // 8 red
];

/** Categorical slots for pie/donut. Capped at 4 — see the all-pairs note above. */
export const SLICE_PALETTE = [
  '#2a78d6', // blue
  '#eb6834', // orange
  '#1baf7a', // aqua
  '#4a3aa7'  // violet
];

/** Neutral for the folded "Other" slice — deliberately outside the categorical set. */
export const OTHER_SLICE = '#898781';

/** ngx-charts expects `{ domain: [...] }`. */
export const SERIES_SCHEME = { domain: SERIES_PALETTE };
export const SLICE_SCHEME = { domain: [...SLICE_PALETTE, OTHER_SLICE] };

/**
 * Chart chrome. Axis/grid ink stays recessive so the data reads first, and
 * value text uses ink tokens rather than the series colour.
 */
export const CHART_INK = {
  primary: '#0b0b0b',
  secondary: '#52514e',
  muted: '#898781',
  gridline: '#e1e0d9',
  baseline: '#c3c2b7'
};
