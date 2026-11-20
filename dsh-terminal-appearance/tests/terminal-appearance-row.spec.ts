import { createElement, type ComponentProps } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { TerminalAppearanceRow } from '../src/client/TerminalAppearanceRow.tsx'

function renderRow(): string {
  const appearance = {
    status: 'ready',
    writable: true,
    value: { preset: 'nord', mode: 'dark' },
  }
  const theme = {
    status: 'ready',
    value: {
      active: { colorScheme: 'dark' },
      fontFamilies: { terminal: 'SF Mono' },
      fontSizes: { terminal: 13 },
    },
  }
  const mutation = {
    status: 'ready',
    value: { busy: false, notice: null },
  }
  const labels: Record<string, string> = {
    palette: '配色方案',
    'preset.nord': 'Nord',
    dark: '始终深色',
  }
  const t = (key: string, values?: Record<string, string>): string => {
    if (key === 'summary') return `${values?.preset} · ${values?.mode} · ${values?.size}px`
    return labels[key] ?? key
  }
  const props = {
    useAppearance: <T,>(selector: (value: typeof appearance) => T): T => selector(appearance),
    useTheme: <T,>(selector: (value: typeof theme.value) => T): T => selector(theme.value),
    useMutation: <T,>(selector: (value: typeof mutation.value) => T): T => selector(mutation.value),
    setPreset: async () => {},
    setMode: async () => {},
    reset: async () => {},
    setFontSize: () => {},
    setFontFamily: () => {},
    t,
  } as unknown as ComponentProps<typeof TerminalAppearanceRow>
  return renderToStaticMarkup(createElement(TerminalAppearanceRow, props))
}

describe('terminal appearance row', () => {
  it('renders collapsed by default with a current-appearance summary', () => {
    const html = renderRow()
    expect(html).toContain('aria-expanded="false"')
    expect(html).toMatch(/aria-controls="[^"]+"/)
    expect(html).toContain('Nord · 始终深色 · 13px')
    expect(html).toContain('hidden=""')
    expect(html).toContain('配色方案')
  })
})
