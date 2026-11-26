// @vitest-environment happy-dom
/** DOM wiring tests for folding long outbound messages. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderChatAppearanceCss } from '../src/client/css.ts'
import {
  FOLD_READY_ATTRIBUTE,
  FOLD_STATE_ATTRIBUTE,
  FOLD_TOGGLE_ATTRIBUTE,
  foldRows,
  forgetFold,
  syncFoldToggles,
  toggleFold,
} from '../src/client/fold-dom.ts'
import { DEFAULT_CHAT_APPEARANCE } from '../src/settings.ts'

const FOLDED = { ...DEFAULT_CHAT_APPEARANCE, collapseLong: true }
const UNFOLDED = { ...DEFAULT_CHAT_APPEARANCE, collapseLong: false }
const LABELS = { more: 'Show more', less: 'Show less' }

interface Fixture {
  root: HTMLElement
  row: HTMLElement
  bubble: HTMLElement
}

/**
 * Build the Chat flow markers the decorator relies on around one outbound row.
 * @param contentHeight - natural bubble height in pixels.
 * @returns the flow root, decorated row, and its bubble.
 */
function mountRow(contentHeight: number): Fixture {
  document.body.innerHTML = `
    <div data-chat-flow>
      <div data-chat-node-key="k1" data-chat-flow-kind="user">
        <div data-slot="conversation.chat.node">
          <div><div><div data-message-bubble></div></div></div>
        </div>
      </div>
    </div>`
  const root = document.querySelector<HTMLElement>('[data-chat-flow]') as HTMLElement
  const row = document.querySelector<HTMLElement>('[data-chat-node-key]') as HTMLElement
  const bubble = document.querySelector<HTMLElement>('[data-message-bubble]') as HTMLElement
  Object.defineProperty(bubble, 'scrollHeight', { configurable: true, value: contentHeight })
  return { root, row, bubble }
}

/**
 * Report a laid-out surface, or none while the row is hidden.
 * @param bubble - the surface to report for.
 * @param rects - whether the surface has boxes.
 */
function layout(bubble: HTMLElement, rects: boolean): void {
  Object.defineProperty(bubble, 'getClientRects', {
    configurable: true,
    value: () => (rects
      ? [{ x: 0, y: 0, width: 320, height: 22 }, { x: 0, y: 22, width: 320, height: 22 }]
      : []) as unknown as DOMRectList,
  })
}

function toggles(fixture: Fixture): number {
  return fixture.row.querySelectorAll(`[${FOLD_TOGGLE_ATTRIBUTE}]`).length
}

describe('long-message fold wiring', () => {
  beforeEach(() => {
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      lineHeight: '22px',
      paddingTop: '10px',
      paddingBottom: '10px',
    } as CSSStyleDeclaration)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('folds a bubble taller than the line budget and adds one control below it', () => {
    const fixture = mountRow(22 * 30)
    layout(fixture.bubble, true)
    foldRows(fixture.root, FOLDED, new Set())
    expect(fixture.row.getAttribute(FOLD_STATE_ATTRIBUTE)).toBe('collapsed')
    expect(fixture.row.hasAttribute(FOLD_READY_ATTRIBUTE)).toBe(true)
    expect(toggles(fixture)).toBe(1)
    expect(fixture.bubble.nextElementSibling?.hasAttribute(FOLD_TOGGLE_ATTRIBUTE)).toBe(true)
  })

  it('keeps a bubble that fits unfolded and measured', () => {
    const fixture = mountRow(22 * 4)
    layout(fixture.bubble, true)
    foldRows(fixture.root, FOLDED, new Set())
    expect(fixture.row.hasAttribute(FOLD_STATE_ATTRIBUTE)).toBe(false)
    expect(fixture.row.hasAttribute(FOLD_READY_ATTRIBUTE)).toBe(true)
    expect(toggles(fixture)).toBe(0)
  })

  it('never adds a second control for the same row', () => {
    const fixture = mountRow(22 * 30)
    layout(fixture.bubble, true)
    foldRows(fixture.root, FOLDED, new Set())
    foldRows(fixture.root, FOLDED, new Set())
    expect(toggles(fixture)).toBe(1)
  })

  it('restores a reader-chosen expansion by message key', () => {
    const fixture = mountRow(22 * 30)
    layout(fixture.bubble, true)
    foldRows(fixture.root, FOLDED, new Set(['k1']))
    expect(fixture.row.getAttribute(FOLD_STATE_ATTRIBUTE)).toBe('expanded')
  })

  it('toggles both directions and remembers the choice', () => {
    const fixture = mountRow(22 * 30)
    layout(fixture.bubble, true)
    const expandedKeys = new Set<string>()
    foldRows(fixture.root, FOLDED, expandedKeys)
    expect(toggleFold(fixture.row, expandedKeys)).toBe(true)
    expect(fixture.row.getAttribute(FOLD_STATE_ATTRIBUTE)).toBe('expanded')
    expect([...expandedKeys]).toEqual(['k1'])
    expect(toggleFold(fixture.row, expandedKeys)).toBe(false)
    expect(fixture.row.getAttribute(FOLD_STATE_ATTRIBUTE)).toBe('collapsed')
    expect([...expandedKeys]).toEqual([])
  })

  it('labels the control for its direction', () => {
    const fixture = mountRow(22 * 30)
    layout(fixture.bubble, true)
    foldRows(fixture.root, FOLDED, new Set())
    syncFoldToggles(fixture.root, LABELS)
    const button = fixture.row.querySelector<HTMLElement>(`[${FOLD_TOGGLE_ATTRIBUTE}]`) as HTMLElement
    expect(button.textContent).toBe('Show more')
    expect(button.getAttribute('aria-expanded')).toBe('false')
    toggleFold(fixture.row, new Set())
    syncFoldToggles(fixture.root, LABELS)
    expect(button.textContent).toBe('Show less')
    expect(button.getAttribute('aria-expanded')).toBe('true')
  })

  it('drops every control when folding is turned off', () => {
    const fixture = mountRow(22 * 30)
    layout(fixture.bubble, true)
    foldRows(fixture.root, FOLDED, new Set())
    foldRows(fixture.root, UNFOLDED, new Set())
    expect(fixture.row.hasAttribute(FOLD_STATE_ATTRIBUTE)).toBe(false)
    expect(fixture.row.hasAttribute(FOLD_READY_ATTRIBUTE)).toBe(false)
    expect(toggles(fixture)).toBe(0)
  })

  it('retries a row that was not laid out instead of recording it as short', () => {
    const hidden = mountRow(22 * 30)
    layout(hidden.bubble, false)
    foldRows(hidden.root, FOLDED, new Set())
    expect(hidden.row.hasAttribute(FOLD_READY_ATTRIBUTE)).toBe(false)
    expect(toggles(hidden)).toBe(0)

    layout(hidden.bubble, true)
    foldRows(hidden.root, FOLDED, new Set())
    expect(hidden.row.getAttribute(FOLD_STATE_ATTRIBUTE)).toBe('collapsed')
    expect(toggles(hidden)).toBe(1)
  })

  it('forgets measurements so a resize can re-evaluate the wrapped text', () => {
    const fixture = mountRow(22 * 4)
    layout(fixture.bubble, true)
    foldRows(fixture.root, FOLDED, new Set())
    forgetFold(fixture.row)
    Object.defineProperty(fixture.bubble, 'scrollHeight', { configurable: true, value: 22 * 30 })
    foldRows(fixture.root, FOLDED, new Set())
    expect(fixture.row.getAttribute(FOLD_STATE_ATTRIBUTE)).toBe('collapsed')
  })

  it('keeps the stylesheet selectors in step with the wiring', () => {
    const css = renderChatAppearanceCss(FOLDED, 'dark')
    expect(css).toContain(`[${FOLD_STATE_ATTRIBUTE}="collapsed"] [data-message-bubble]`)
    expect(css).toContain(`[${FOLD_TOGGLE_ATTRIBUTE}]`)
    expect(css).toContain('[data-message-bubble]')
  })
})
