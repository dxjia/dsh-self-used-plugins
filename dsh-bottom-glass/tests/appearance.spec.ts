import { describe, expect, it } from 'vitest'
import { INSPECTOR_GLASS_CSS, renderBottomGlassCss } from '../src/client/runtime.ts'

describe('bottom-glass stylesheet', () => {
  it('paints the full-width slot with configurable blur and saturation', () => {
    const css = renderBottomGlassCss({
      enabled: true,
      opacity: 72,
      blur: 28,
      saturation: 144,
    })
    expect(css).toContain('body[data-dsh-bottom-glass] [data-shell-bottom]')
    expect(css).toContain('var(--dsw-alias-bg-base) 72%')
    expect(css).toContain('blur(28px) saturate(144%)')
    expect(css).toContain('prefers-reduced-transparency: reduce')
    expect(css).not.toContain('opacity:')
  })

  it('includes the sidebar and bottom chat surfaces without painting unrelated terminal content', () => {
    const css = renderBottomGlassCss({ enabled: true, opacity: 80, blur: 18, saturation: 130 })
    expect(css).toContain('[data-composer-seat]')
    expect(css).toContain('[data-slot="sidebar"]')
    expect(css).toContain('div:has(> [data-conversation-content])')
    expect(css).toContain('div:has(> [data-slot="rightbar"])')
    expect(css).toContain("[data-dockkit-host='dock'] > [data-dockkit-pane]")
    expect(css).toContain('[data-dockkit-empty]')
    expect(css).toContain('[data-sidebar-terminal]')
    expect(css).toContain('.xterm-viewport')
    expect(css).toContain('[data-files-navigator]')
    expect(css).not.toContain('.xterm-fg-')
    expect(css).not.toContain('body {')
  })

  it('makes the same-origin Inspector document participate in the outer glass', () => {
    expect(INSPECTOR_GLASS_CSS).toContain('--sys-color-cdt-base-container: transparent')
    expect(INSPECTOR_GLASS_CSS).toContain('#-blink-dev-tools')
    expect(INSPECTOR_GLASS_CSS).toContain('background: transparent')
    expect(INSPECTOR_GLASS_CSS).not.toContain('opacity:')
  })
})
