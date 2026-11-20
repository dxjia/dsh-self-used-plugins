import { transform } from 'lightningcss'
import { describe, expect, it } from 'vitest'
import type { ModelDirectoryState } from '@deepseek-ai/dsh-client-ui-model-selection/client'
import { renderChatAppearanceCss, readableForeground } from '../src/client/css.ts'
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
    })
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
    expect(() => transform({ filename: `${style}-${colorScheme}.css`, code: Buffer.from(css) })).not.toThrow()
  })

  it('chooses readable foregrounds for solid user bubbles', () => {
    expect(readableForeground('#ffffff')).toBe('#101317')
    expect(readableForeground('#111827')).toBe('#ffffff')
  })
})
