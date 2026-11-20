import { describe, expect, it } from 'vitest'
import { ansiSlotName, renderTerminalAppearanceCss } from '../src/appearance-css.ts'
import { adjustedAnsiMap } from '../src/inline-ansi.ts'
import { resolveTerminalPalette, TERMINAL_PRESETS } from '../src/palettes.ts'
import { PRESET_IDS } from '../src/settings.ts'

function channels(hex: string): [number, number, number] {
  return [Number.parseInt(hex.slice(1, 3), 16), Number.parseInt(hex.slice(3, 5), 16), Number.parseInt(hex.slice(5, 7), 16)]
}

function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map((channel) => {
    const value = channel / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

function contrast(foreground: string, background: string): number {
  const first = luminance(foreground)
  const second = luminance(background)
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
}

describe('terminal palettes', () => {
  it('defines all selectable presets and resolves light/dark modes', () => {
    expect(PRESET_IDS).toEqual(['dsh', 'homebrew', 'graphite', 'nord', 'tokyo-night', 'solarized', 'gruvbox'])
    expect(resolveTerminalPalette('dsh', 'follow', 'dark')).toBeUndefined()
    expect(resolveTerminalPalette('nord', 'follow', 'dark')).toBe(TERMINAL_PRESETS.nord.dark)
    expect(resolveTerminalPalette('nord', 'light', 'dark')).toBe(TERMINAL_PRESETS.nord.light)
  })

  it('keeps default terminal text readable in every preset variant', () => {
    for (const [id, preset] of Object.entries(TERMINAL_PRESETS)) {
      expect(contrast(preset.light.foreground, preset.light.background), `${id} light`).toBeGreaterThanOrEqual(4.5)
      expect(contrast(preset.dark.foreground, preset.dark.background), `${id} dark`).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('renders scoped default and ANSI rules without global theme overrides', () => {
    const css = renderTerminalAppearanceCss(TERMINAL_PRESETS.nord.dark)
    expect(css).toContain('[data-sidebar-terminal] {')
    expect(css).toContain('.xterm-fg-1')
    expect(css).toContain('.xterm-bg-15')
    expect(css).toContain('--dsw-alias-bg-base: var(--terminal-appearance-background)')
    expect(css).not.toContain('body {')
  })

  it('names every ANSI slot for diagnostics', () => {
    expect(ansiSlotName(0)).toBe('black')
    expect(ansiSlotName(15)).toBe('bright-white')
  })

  it('recognizes xterm contrast-adjusted default ANSI colors', () => {
    const map = adjustedAnsiMap(['#2e3440'])
    expect(map.get('233,135,135')).toBe(1)
    expect(map.get('112,174,54')).toBe(2)
  })

  it('imports the local iTerm2 Homebrew palette exactly', () => {
    expect(TERMINAL_PRESETS.homebrew.dark).toMatchObject({
      background: '#000000',
      foreground: '#28fe14',
      selection: 'rgba(12, 46, 238, 0.65)',
      ansi: [
        '#000000', '#c91b00', '#00c200', '#c7c400', '#0225c7', '#ca30c6', '#00c5c7', '#c7c7c7',
        '#686868', '#ff6e67', '#5ff967', '#fecb6e', '#6871ff', '#ff76ff', '#5ffcff', '#ffffff',
      ],
    })
  })
})
