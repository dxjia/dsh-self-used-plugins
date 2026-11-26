import { transform } from 'lightningcss'
import { describe, expect, it } from 'vitest'
import type { ModelDirectoryState } from '@deepseek-ai/dsh-client-ui-model-selection/client'
import { renderChatAppearanceCss, readableForeground } from '../src/client/css.ts'
import { FOLD_LINES, exceedsFoldHeight, foldHeight } from '../src/client/fold.ts'
import {
  formatLastUpdated,
  messageMeta,
  resolveModelDisplayName,
} from '../src/client/time.ts'
import {
  DEFAULT_CHAT_APPEARANCE,
  normalizeChatAppearanceSettings,
} from '../src/settings.ts'

describe('chat appearance settings', () => {
  it('normalizes invalid persisted values without losing valid fields', () => {
    expect(normalizeChatAppearanceSettings({
      style: 'image',
      accent: 'not-a-color',
      showNames: false,
      senderName: '  Ada  ',
      backgroundPreset: 'custom',
      customImageId: 'bg-test',
    })).toEqual({
      style: 'image',
      accent: DEFAULT_CHAT_APPEARANCE.accent,
      showNames: false,
      senderName: 'Ada',
      backgroundPreset: 'custom',
      customImageId: 'bg-test',
      collapseLong: true,
    })
  })

  it('keeps an explicit fold choice and defaults it on', () => {
    expect(normalizeChatAppearanceSettings({ collapseLong: false }).collapseLong).toBe(false)
    expect(normalizeChatAppearanceSettings({}).collapseLong).toBe(true)
    expect(DEFAULT_CHAT_APPEARANCE.collapseLong).toBe(true)
  })
})

describe('long-message folding', () => {
  it('derives the visible height from the line budget, line height, and padding', () => {
    expect(foldHeight(22, 10, 10)).toBe(22 * FOLD_LINES + 20)
    expect(foldHeight(0, 10, 10)).toBeUndefined()
    expect(foldHeight(Number.NaN, 10, 10)).toBeUndefined()
    expect(foldHeight(22, Number.POSITIVE_INFINITY, 10)).toBeUndefined()
  })

  it('folds only when the content grows past the budget', () => {
    const limit = foldHeight(22, 10, 10) as number
    expect(exceedsFoldHeight(limit - 44, 22, 10, 10)).toBe(false)
    expect(exceedsFoldHeight(limit, 22, 10, 10)).toBe(false)
    expect(exceedsFoldHeight(limit + 0.6, 22, 10, 10)).toBe(false)
    expect(exceedsFoldHeight(limit + 22, 22, 10, 10)).toBe(true)
    expect(exceedsFoldHeight(limit + 22, Number.NaN, 10, 10)).toBe(false)
    expect(exceedsFoldHeight(Number.NaN, 22, 10, 10)).toBe(false)
  })
})

describe('message metadata', () => {
  it('formats the last-updated date and time without a year', () => {
    const local = new Date(2026, 10, 20, 21, 42, 0).getTime()
    expect(formatLastUpdated(local)).toBe('11/20 21:42')
  })

  it('keeps time while hiding the configured role name', () => {
    expect(messageMeta('Jia', '11/20 21:42', true)).toBe('Jia · 11/20 21:42')
    expect(messageMeta('Jia', '11/20 21:42', false)).toBe('11/20 21:42')
  })

  it('uses the current model display name and falls back to its route id', () => {
    const state: ModelDirectoryState = {
      current: { provider: 'deepseek-official', model: 'deepseek-v4.1' },
      routable: true,
      groups: [{
        id: 'deepseek-official',
        name: 'DeepSeek',
        models: [{ id: 'deepseek-v4.1', name: 'DeepSeek V4.1' }],
      }],
      failures: [],
      status: 'ready',
      pending: null,
      error: null,
    }
    expect(resolveModelDisplayName(state, 'AI')).toBe('DeepSeek V4.1')
    expect(resolveModelDisplayName({ ...state, groups: [] }, 'AI')).toBe('deepseek-v4.1')
  })
})

describe('chat appearance CSS', () => {
  it.each([
    ['bubble', 'light', undefined],
    ['solid', 'dark', undefined],
    ['image', 'light', 'blob:https://dsh.local/background'],
    ['image', 'dark', undefined],
  ] as const)('renders valid %s CSS in %s mode', (style, colorScheme, imageUrl) => {
    const css = renderChatAppearanceCss({
      ...DEFAULT_CHAT_APPEARANCE,
      style,
      backgroundPreset: style === 'image' ? 'custom' : 'dusk',
      customImageId: style === 'image' ? 'bg-test' : '',
    }, colorScheme, imageUrl)
    expect(css).toContain('[data-dsh-im-enabled]')
    expect(css).toContain('data-dsh-im-meta')
    expect(css).toContain('data-dsh-im-assistant-surface')
    expect(css).toContain('position: absolute')
    expect(css).toContain('padding-top: 21px')
    expect(css).toContain(`calc(${FOLD_LINES} * 1lh`)
    expect(css).toContain('data-dsh-im-fold-state="collapsed"')
    expect(css).toContain('data-dsh-im-fold-toggle')
    expect(css).toContain('align-self: flex-start')
    expect(() => transform({ filename: `${style}-${colorScheme}.css`, code: Buffer.from(css) })).not.toThrow()
  })

  it('chooses readable foregrounds for solid user bubbles', () => {
    expect(readableForeground('#ffffff')).toBe('#101317')
    expect(readableForeground('#111827')).toBe('#ffffff')
  })
})
