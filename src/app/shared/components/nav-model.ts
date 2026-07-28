/**
 * One description of a dashboard's navigation, rendered three ways.
 *
 * Client, worker and admin each used to hand-write their navigation twice — a
 * desktop `<aside>` and a mobile bottom bar — which is how the two drifted
 * apart: the client bottom bar carried six items that could not fit 320px, the
 * worker bar silently dropped Messages and Disputes, and admin had no mobile
 * navigation at all beyond a toggle buried in the page body.
 *
 * A layout now declares its navigation once as `AppNavSection[]` and the shell
 * renders it as the desktop sidebar, the hamburger drawer, and the bottom bar.
 * The three cannot disagree, and the 320px arithmetic is solved in one place.
 */

export type NavBadgeTone = 'brand' | 'warn' | 'ok' | 'danger';

export interface AppNavItem {
  /** Absolute route, so the item resolves the same from any host component. */
  path: string;
  label: string;
  icon: string;

  /**
   * Label for the bottom bar. Keep to a single short word: at 320px each of
   * the five slots is 64px wide, which is roughly seven uppercase characters
   * at the 9px bar type size.
   */
  shortLabel?: string;

  /** Pill contents — a count, a percentage, "Ready ✓". Falsy hides the pill. */
  badge?: string | number | null;
  badgeTone?: NavBadgeTone;

  /**
   * Gated items stay visible but unclickable, with `lockReason` shown inline.
   * The desktop sidebar used to explain the gate in a hover tooltip, which is
   * unreachable on a touch device — the reason is now always rendered.
   */
  locked?: boolean;
  lockReason?: string;

  /** Include in the mobile bottom bar. At most four are used. */
  primary?: boolean;

  /** Exact route matching, for parent paths like `/admin`. */
  exact?: boolean;
}

export interface AppNavSection {
  label: string;
  items: AppNavItem[];
}

/** The bar shows four routes plus the menu button, which fits 320px. */
export const MAX_BOTTOM_NAV_ITEMS = 4;

export function flattenNav(sections: AppNavSection[]): AppNavItem[] {
  return sections.flatMap(section => section.items);
}

export function bottomNavItems(sections: AppNavSection[]): AppNavItem[] {
  const all = flattenNav(sections);
  const flagged = all.filter(item => item.primary);
  // Falling back to leading items keeps the bar populated if a layout forgets
  // to flag anything, rather than rendering an empty strip.
  return (flagged.length ? flagged : all).slice(0, MAX_BOTTOM_NAV_ITEMS);
}
