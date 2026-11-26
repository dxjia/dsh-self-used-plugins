/** Visible-line budget shared by folded user messages and their stylesheet rule. */

/** Content lines a folded user message keeps visible. */
export const FOLD_LINES = 10

/**
 * Tallest content box that still shows exactly {@link FOLD_LINES} lines.
 * @param lineHeight - used line height of the message surface, in pixels.
 * @param paddingTop - top padding of the message surface, in pixels.
 * @param paddingBottom - bottom padding of the message surface, in pixels.
 * @returns the fold height in pixels, or `undefined` when the metrics are unusable.
 */
export function foldHeight(
  lineHeight: number,
  paddingTop: number,
  paddingBottom: number,
): number | undefined {
  const usable = [lineHeight, paddingTop, paddingBottom].every(value => Number.isFinite(value) && value >= 0)
  if (!usable || lineHeight <= 0) return undefined
  return lineHeight * FOLD_LINES + paddingTop + paddingBottom
}

/**
 * Decide whether a rendered message is taller than the visible line budget.
 * @param contentHeight - natural content height reported by the surface, in pixels.
 * @param lineHeight - used line height of the message surface, in pixels.
 * @param paddingTop - top padding of the message surface, in pixels.
 * @param paddingBottom - bottom padding of the message surface, in pixels.
 * @returns whether the message needs a fold control.
 */
export function exceedsFoldHeight(
  contentHeight: number,
  lineHeight: number,
  paddingTop: number,
  paddingBottom: number,
): boolean {
  const limit = foldHeight(lineHeight, paddingTop, paddingBottom)
  if (limit === undefined || !Number.isFinite(contentHeight)) return false
  // A sub-pixel difference is layout rounding, not an extra line.
  return contentHeight > limit + 1
}
