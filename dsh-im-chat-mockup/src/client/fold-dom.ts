/** DOM wiring that folds overlong outbound messages without owning their render. */
import type { ChatAppearanceSettings } from '../settings.ts'
import { exceedsFoldHeight } from './fold.ts'

/** Durable outbound rows whose bubble can fold; pending and echo rows are skipped. */
export const OUTBOUND_ROW_SELECTOR = '[data-chat-flow-kind="user"], [data-chat-flow-kind="steering"]'

/** Row state while folded; absence means the row has no fold control. */
export const FOLD_STATE_ATTRIBUTE = 'data-dsh-im-fold-state'

/** Marks a row whose height has been measured against the line budget. */
export const FOLD_READY_ATTRIBUTE = 'data-dsh-im-fold-ready'

/** The plugin-owned expand/collapse button below a folded bubble. */
export const FOLD_TOGGLE_ATTRIBUTE = 'data-dsh-im-fold-toggle'

/** Localized fold-control copy. */
export interface FoldLabels {
  readonly more: string
  readonly less: string
}

/**
 * Measure a rendered user bubble against the visible line budget.
 * @param bubble - the user-message surface.
 * @returns whether it overflows, or `undefined` while the surface is not laid out.
 */
export function exceedsLineBudget(bubble: HTMLElement): boolean | undefined {
  // A hidden or not-yet-laid-out row reports no height; measuring it would
  // record "fits" and keep a long message unfolded forever.
  if (bubble.getClientRects().length === 0) return undefined
  const style = window.getComputedStyle(bubble)
  const lineHeight = Number.parseFloat(style.lineHeight)
  if (!Number.isFinite(lineHeight) || lineHeight <= 0) return undefined
  return exceedsFoldHeight(
    bubble.scrollHeight,
    lineHeight,
    Number.parseFloat(style.paddingTop),
    Number.parseFloat(style.paddingBottom),
  )
}

/**
 * Create the plugin-owned fold control that sits directly below one bubble.
 * @returns a detached, unlabeled button.
 */
function createFoldToggle(): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.setAttribute(FOLD_TOGGLE_ATTRIBUTE, '')
  button.setAttribute('aria-expanded', 'false')
  return button
}

/**
 * Drop one row's fold control and measurements so the next pass rebuilds them.
 * @param row - a durable outbound message row.
 */
export function forgetFold(row: HTMLElement): void {
  row.removeAttribute(FOLD_READY_ATTRIBUTE)
  row.removeAttribute(FOLD_STATE_ATTRIBUTE)
  for (const button of row.querySelectorAll<HTMLElement>(`[${FOLD_TOGGLE_ATTRIBUTE}]`)) button.remove()
}

/**
 * Record one row's fold direction.
 * @param row - a foldable outbound row.
 * @param expanded - whether the full message is visible.
 */
export function setFoldState(row: HTMLElement, expanded: boolean): void {
  const state = expanded ? 'expanded' : 'collapsed'
  if (row.getAttribute(FOLD_STATE_ATTRIBUTE) !== state) row.setAttribute(FOLD_STATE_ATTRIBUTE, state)
}

/**
 * Keep every fold control labeled for its direction and current locale.
 * @param root - the visible Chat flow.
 * @param labels - localized expand and collapse copy.
 */
export function syncFoldToggles(root: HTMLElement, labels: FoldLabels): void {
  for (const row of root.querySelectorAll<HTMLElement>(OUTBOUND_ROW_SELECTOR)) {
    const button = row.querySelector<HTMLElement>(`[${FOLD_TOGGLE_ATTRIBUTE}]`)
    if (button === null) continue
    const expanded = row.getAttribute(FOLD_STATE_ATTRIBUTE) === 'expanded'
    const label = expanded ? labels.less : labels.more
    if (button.textContent !== label) button.textContent = label
    const ariaExpanded = expanded ? 'true' : 'false'
    if (button.getAttribute('aria-expanded') !== ariaExpanded) button.setAttribute('aria-expanded', ariaExpanded)
  }
}

/**
 * Measure newly rendered outbound rows and add or drop their fold controls.
 * @param root - the visible Chat flow.
 * @param settings - current appearance settings.
 * @param expandedKeys - message keys the reader expanded, preserved across row rebuilds.
 */
export function foldRows(root: HTMLElement, settings: ChatAppearanceSettings, expandedKeys: ReadonlySet<string>): void {
  for (const row of root.querySelectorAll<HTMLElement>(OUTBOUND_ROW_SELECTOR)) {
    if (!settings.collapseLong) {
      if (row.hasAttribute(FOLD_READY_ATTRIBUTE) || row.hasAttribute(FOLD_STATE_ATTRIBUTE)) forgetFold(row)
      continue
    }
    if (row.hasAttribute(FOLD_READY_ATTRIBUTE)) continue
    const bubble = row.querySelector<HTMLElement>('[data-message-bubble]')
    if (bubble === null) continue
    const overflowing = exceedsLineBudget(bubble)
    if (overflowing === undefined) continue
    row.setAttribute(FOLD_READY_ATTRIBUTE, '')
    for (const stale of row.querySelectorAll<HTMLElement>(`[${FOLD_TOGGLE_ATTRIBUTE}]`)) stale.remove()
    if (!overflowing) {
      row.removeAttribute(FOLD_STATE_ATTRIBUTE)
      continue
    }
    const key = row.dataset.chatNodeKey
    setFoldState(row, key !== undefined && expandedKeys.has(key))
    bubble.insertAdjacentElement('afterend', createFoldToggle())
  }
}

/**
 * Flip one row between folded and full view and remember the choice by message key.
 * @param row - a foldable outbound row.
 * @param expandedKeys - message keys the reader expanded.
 * @returns whether the row is now expanded.
 */
export function toggleFold(row: HTMLElement, expandedKeys: Set<string>): boolean {
  const expanded = row.getAttribute(FOLD_STATE_ATTRIBUTE) !== 'expanded'
  setFoldState(row, expanded)
  const key = row.dataset.chatNodeKey
  if (key !== undefined) {
    if (expanded) expandedKeys.add(key)
    else expandedKeys.delete(key)
  }
  return expanded
}
