/** Recolor xterm ANSI cells whose minimum-contrast pass replaced their class with an inline RGB value. */
import { TERMINAL_PRESETS, XTERM_DEFAULT_ANSI, type TerminalPalette } from './palettes.ts'
const MINIMUM_CONTRAST_RATIO = 4.5
const ANSI_INDEX_ATTRIBUTE = 'data-terminal-appearance-index'
const SOURCE_ATTRIBUTE = 'data-terminal-appearance-source'

type Channels = readonly [number, number, number]

function parseHex(value: string): Channels {
  return [
    Number.parseInt(value.slice(1, 3), 16),
    Number.parseInt(value.slice(3, 5), 16),
    Number.parseInt(value.slice(5, 7), 16),
  ]
}

function parseCssColor(value: string): Channels | undefined {
  const match = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/u.exec(value)
  if (match === null) return undefined
  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

function colorKey(channels: Channels): string {
  return channels.join(',')
}

function luminance([red, green, blue]: Channels): number {
  const linear = [red, green, blue].map((channel) => {
    const value = channel / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!
}

function contrast(first: number, second: number): number {
  return first < second
    ? (second + 0.05) / (first + 0.05)
    : (first + 0.05) / (second + 0.05)
}

function increaseLuminance(background: Channels, foreground: Channels): Channels {
  const backgroundLuminance = luminance(background)
  let [red, green, blue] = foreground
  let ratio = contrast(luminance([red, green, blue]), backgroundLuminance)
  while (ratio < MINIMUM_CONTRAST_RATIO && (red < 255 || green < 255 || blue < 255)) {
    red = Math.min(255, red + Math.ceil((255 - red) * 0.1))
    green = Math.min(255, green + Math.ceil((255 - green) * 0.1))
    blue = Math.min(255, blue + Math.ceil((255 - blue) * 0.1))
    ratio = contrast(luminance([red, green, blue]), backgroundLuminance)
  }
  return [red, green, blue]
}

function reduceLuminance(background: Channels, foreground: Channels): Channels {
  const backgroundLuminance = luminance(background)
  let [red, green, blue] = foreground
  let ratio = contrast(luminance([red, green, blue]), backgroundLuminance)
  while (ratio < MINIMUM_CONTRAST_RATIO && (red > 0 || green > 0 || blue > 0)) {
    red -= Math.max(0, Math.ceil(red * 0.1))
    green -= Math.max(0, Math.ceil(green * 0.1))
    blue -= Math.max(0, Math.ceil(blue * 0.1))
    ratio = contrast(luminance([red, green, blue]), backgroundLuminance)
  }
  return [red, green, blue]
}

function ensureContrast(background: Channels, foreground: Channels): Channels | undefined {
  const backgroundLuminance = luminance(background)
  const foregroundLuminance = luminance(foreground)
  if (contrast(backgroundLuminance, foregroundLuminance) >= MINIMUM_CONTRAST_RATIO) return undefined
  const first = foregroundLuminance < backgroundLuminance
    ? reduceLuminance(background, foreground)
    : increaseLuminance(background, foreground)
  const firstRatio = contrast(backgroundLuminance, luminance(first))
  if (firstRatio >= MINIMUM_CONTRAST_RATIO) return first
  const second = foregroundLuminance < backgroundLuminance
    ? increaseLuminance(background, foreground)
    : reduceLuminance(background, foreground)
  return contrast(backgroundLuminance, luminance(second)) > firstRatio ? second : first
}

/**
 * Map xterm's contrast-adjusted default ANSI colors to their original indices.
 * @param backgrounds - terminal backgrounds xterm may have used for its contrast pass.
 * @returns inline RGB keys to ANSI indices.
 */
export function adjustedAnsiMap(backgrounds: Iterable<string>): ReadonlyMap<string, number> {
  const result = new Map<string, number>()
  for (const backgroundHex of backgrounds) {
    const background = parseHex(backgroundHex)
    XTERM_DEFAULT_ANSI.forEach((foregroundHex, index) => {
      const foreground = parseHex(foregroundHex)
      const adjusted = ensureContrast(background, foreground)
      if (adjusted !== undefined) result.set(colorKey(adjusted), index)
    })
  }
  return result
}

/** Observe terminal DOM mutations and apply ANSI colors that xterm could not express as classes. */
export interface InlineAnsiPainter {
  /** Apply a palette to existing cells, or restore xterm's inline colors for the default preset. */
  update(palette: TerminalPalette | undefined): void
  /** Stop observing and restore every cell this painter changed. */
  dispose(): void
}

/**
 * Install the inline ANSI painter for this document.
 * @returns a painter whose lifetime is owned by the plugin stylesheet runtime.
 */
export function createInlineAnsiPainter(): InlineAnsiPainter {
  const roots = (): HTMLElement[] => [...document.querySelectorAll<HTMLElement>('[data-sidebar-terminal]')]
  const dirty = new Set<HTMLElement>()
  let palette: TerminalPalette | undefined
  let map = adjustedAnsiMap(knownBackgrounds())
  let poll: ReturnType<typeof setInterval> | undefined

  const paint = (element: HTMLElement): void => {
    if (palette === undefined) {
      const source = element.getAttribute(SOURCE_ATTRIBUTE)
      if (source !== null) element.style.color = source
      element.removeAttribute(SOURCE_ATTRIBUTE)
      element.removeAttribute(ANSI_INDEX_ATTRIBUTE)
      return
    }
    const indexAttr = element.getAttribute(ANSI_INDEX_ATTRIBUTE)
    if (indexAttr !== null) {
      const index = Number(indexAttr)
      const target = palette.ansi[index]
      if (target !== undefined) {
        const current = element.style.color
        const source = element.getAttribute(SOURCE_ATTRIBUTE)
        if (current === target || current === source) {
          if (current !== target) element.style.color = target
          return
        }
        element.removeAttribute(SOURCE_ATTRIBUTE)
        element.removeAttribute(ANSI_INDEX_ATTRIBUTE)
      }
    }
    const source = element.style.color
    const channels = parseCssColor(source)
    if (channels === undefined) return
    const index = map.get(colorKey(channels))
    if (index === undefined) return
    const target = palette.ansi[index]!
    element.setAttribute(SOURCE_ATTRIBUTE, source)
    element.setAttribute(ANSI_INDEX_ATTRIBUTE, String(index))
    element.style.color = target
  }

  const flush = (): void => {
    const targets = dirty.size > 0 ? dirty : new Set<HTMLElement>()
    dirty.clear()
    for (const element of targets) if (element.isConnected) paint(element)
  }
  const scanAll = (): void => {
    for (const root of roots()) {
      for (const element of root.querySelectorAll<HTMLElement>('.xterm-rows span[style*="color"]')) {
        paint(element)
      }
    }
  }

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'attributes' && record.target.nodeType === Node.ELEMENT_NODE) {
        dirty.add(record.target as HTMLElement)
        continue
      }
      for (const node of record.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue
        const element = node as HTMLElement
        if (element.matches('span[style*="color"]') && element.closest('.xterm-rows') !== null) dirty.add(element)
        for (const span of element.querySelectorAll<HTMLElement>('span[style*="color"]')) {
          if (span.closest('.xterm-rows') !== null) dirty.add(span)
        }
      }
    }
    flush()
  })
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style'],
  })
  const startPolling = (): void => {
    poll ??= setInterval(scanAll, 250)
  }
  const stopPolling = (): void => {
    if (poll === undefined) return
    clearInterval(poll)
    poll = undefined
  }

  return {
    update(next) {
      palette = next
      if (palette === undefined) {
        stopPolling()
        for (const root of roots()) {
          for (const element of root.querySelectorAll<HTMLElement>(`[${ANSI_INDEX_ATTRIBUTE}]`)) paint(element)
        }
        return
      }
      map = adjustedAnsiMap(knownBackgrounds(palette))
      startPolling()
      scanAll()
    },
    dispose() {
      observer.disconnect()
      stopPolling()
      palette = undefined
      for (const root of roots()) {
        for (const element of root.querySelectorAll<HTMLElement>(`[${ANSI_INDEX_ATTRIBUTE}]`)) paint(element)
      }
    },
  }
}

function knownBackgrounds(selected?: TerminalPalette): Set<string> {
  const backgrounds = new Set<string>()
  for (const preset of Object.values(TERMINAL_PRESETS)) {
    backgrounds.add(preset.light.background)
    backgrounds.add(preset.dark.background)
  }
  backgrounds.add('#000000')
  backgrounds.add('#ffffff')
  const variable = getComputedStyle(document.body).getPropertyValue('--dsw-alias-bg-base').trim()
  if (/^#[\da-f]{6}$/iu.test(variable)) backgrounds.add(variable.toLowerCase())
  if (selected !== undefined) backgrounds.add(selected.background)
  return backgrounds
}
