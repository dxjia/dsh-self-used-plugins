import { createElement, type ComponentProps, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { BottomGlassRow } from '../src/client/BottomGlassRow.tsx'

vi.mock('@deepseek-ai/dsh-client-ui-primitives', async () => {
  const { createElement: h } = await import('react')
  return {
    Button: ({ children, ...props }: { children?: ReactNode }) => h('button', props, children),
    IconChevronDownOutlineRegular: () => h('svg'),
  }
})

function renderRow(): string {
  const appearance = {
    status: 'ready',
    writable: true,
    value: { enabled: true, liquidGlass: false, opacity: 48, blur: 24, saturation: 140 },
  }
  const mutation = {
    status: 'ready',
    value: { busy: false, notice: null, sequence: 0 },
  }
  const labels: Record<string, string> = {
    title: '底部与侧栏毛玻璃',
    description: '调整侧边栏和聊天底部的背景浓度、模糊和饱和度。',
    summaryOn: '毛玻璃 · 背景 48% · 模糊 24px',
    opacity: '背景浓度',
    blur: '模糊强度',
    saturation: '饱和度',
    liquidGlass: '液态玻璃高光',
  }
  const t = (key: string): string => labels[key] ?? key
  const props = {
    useAppearance: <T,>(selector: (value: typeof appearance) => T): T => selector(appearance),
    useMutation: <T,>(selector: (value: typeof mutation.value) => T): T => selector(mutation.value),
    setEnabled: async () => {},
    setLiquidGlass: async () => {},
    setOpacity: async () => {},
    setBlur: async () => {},
    setSaturation: async () => {},
    reset: async () => {},
    t,
  } as ComponentProps<typeof BottomGlassRow>
  return renderToStaticMarkup(createElement(BottomGlassRow, props))
}

describe('bottom-glass row', () => {
  it('renders collapsed by default with the active glass settings', () => {
    const html = renderRow()
    expect(html).toContain('aria-expanded="false"')
    expect(html).toContain('毛玻璃 · 背景 48% · 模糊 24px')
    expect(html).toContain('hidden=""')
    expect(html.match(/type="range"/g)).toHaveLength(3)
    expect(html.match(/role="switch"/g)).toHaveLength(2)
    expect(html).toContain('aria-label="液态玻璃高光"')
    expect(html).toContain('value="48"')
    expect(html).toContain('value="24"')
    expect(html).toContain('value="140"')
  })
})
