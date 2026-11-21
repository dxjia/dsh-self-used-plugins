import { describe, expect, it } from 'vitest'
import { INSPECTOR_GLASS_CSS, renderBottomGlassCss } from '../src/client/runtime.ts'

describe('bottom-glass stylesheet', () => {
  it('paints the full-width slot with configurable blur and saturation', () => {
    const css = renderBottomGlassCss({
      enabled: true,
      liquidGlass: false,
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
    const css = renderBottomGlassCss({
      enabled: true, liquidGlass: false, opacity: 80, blur: 18, saturation: 130,
    })
    expect(css).toContain('[data-composer-seat]')
    expect(css).toContain('[data-composer-card]')
    expect(css).toContain('[data-composer-dock]')
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

  it('paints each composer card at the shared width without leaking through the seat', () => {
    const css = renderBottomGlassCss({
      enabled: true, liquidGlass: false, opacity: 48, blur: 24, saturation: 140,
    })
    const seatRule = css.match(
      /\[data-conversation-content\] \[data-composer-seat\] \{([\s\S]*?)\n\}/,
    )?.[1]
    expect(seatRule).toContain('background: none')

    const cardRule = css.match(/\[data-composer-card\] \{([\s\S]*?)\n\}/)?.[1]
    expect(cardRule).toContain('var(--dsw-specific-input-major) 48%')
    expect(cardRule).toContain('backdrop-filter: blur(24px) saturate(140%)')

    const dockRule = css.match(/\[data-composer-dock\] \{([\s\S]*?)\n\}/)?.[1]
    expect(dockRule).toContain('width: calc(100% - 4 * var(--dsh-composer-dock-inset))')
    expect(dockRule).toContain('var(--dsh-composer-card-max-width) -')
    expect(dockRule).toContain('4 * var(--dsh-composer-dock-inset)')
    expect(dockRule).toContain('margin: var(--dsh-composer-stack-gap) auto 0')
    expect(dockRule).toContain('border-radius: var(--dsw-radius-md)')
    expect(dockRule).toContain('var(--dsw-alias-label-primary) 4%')
    expect(dockRule).toContain('calc(48% + 10%)')
    expect(dockRule).toContain('inset 0 1px 0')
    expect(dockRule).toContain('0 4px 12px')
    expect(dockRule).toContain('backdrop-filter: blur(24px) saturate(140%)')
  })

  it('gives goal, queue, and todo panels the same glass treatment', () => {
    const css = renderBottomGlassCss({
      enabled: true, liquidGlass: false, opacity: 48, blur: 24, saturation: 140,
    })
    expect(css).toContain("[data-goal-bar] > div::before")
    expect(css).toContain("[data-queue-dock] > div::before")
    expect(css).toContain("[data-testid='todo-panel']")

    const goalRule = css.match(/\[data-goal-bar\] > div::before \{([\s\S]*?)\n\}/)?.[1]
    expect(goalRule).toContain('var(--dsw-alias-label-primary) 4%')
    expect(goalRule).toContain('calc(48% + 10%)')
    expect(goalRule).toContain('0 4px 12px')

    const reducedTransparency = css.slice(css.indexOf('@media (prefers-reduced-transparency: reduce)'))
    expect(reducedTransparency).toContain('[data-goal-bar] > div::before')
    expect(reducedTransparency).toContain('[data-queue-dock] > div::before')
    expect(reducedTransparency).toContain("[data-testid='todo-panel']")
    expect(reducedTransparency).toContain('[data-composer-dock]')
    expect(reducedTransparency).toContain('backdrop-filter: none')
  })

  it('keeps the add-command menu readable over the translucent composer', () => {
    const css = renderBottomGlassCss({
      enabled: true, liquidGlass: false, opacity: 48, blur: 24, saturation: 140,
    })
    const menuRule = css.match(
      /\[data-trigger-menu\] > \[aria-hidden='true'\] \{([\s\S]*?)\n\}/,
    )?.[1]
    expect(menuRule).toContain('background: transparent')
    expect(menuRule).toContain('backdrop-filter: var(--dsw-menu-backdrop-filter)')

    const menuSurface = css.match(/\[data-trigger-menu\] \{([\s\S]*?)\n\}/)?.[1]
    expect(menuSurface).toContain('background: var(--dsw-specific-menu)')
  })

  it('adds optional Liquid Glass-inspired highlights without changing reduced-transparency fallbacks', () => {
    const standard = renderBottomGlassCss({
      enabled: true, liquidGlass: false, opacity: 48, blur: 24, saturation: 140,
    })
    expect(standard).not.toContain('contrast(1.04)')

    const liquid = renderBottomGlassCss({
      enabled: true, liquidGlass: true, opacity: 48, blur: 24, saturation: 140,
    })
    const liquidEnhancement = liquid.match(
      /@media \(prefers-reduced-transparency: no-preference\)[\s\S]*?\n\}\n/,
    )?.[0]
    expect(liquidEnhancement).toContain('[data-composer-card] button:not(')
    expect(liquidEnhancement).toContain("[data-composer-card] [role='button']:not(")
    expect(liquidEnhancement).toContain("[data-slot='conversation.input.permission'] *")
    expect(liquidEnhancement).toContain("[data-slot='conversation.input.model'] *")
    expect(liquidEnhancement).toContain("[data-slot='conversation.input.overlay'] *")
    expect(liquidEnhancement).not.toContain('[data-goal-bar]')
    expect(liquidEnhancement).not.toContain('[data-queue-dock]')
    expect(liquidEnhancement).not.toContain('[data-composer-dock]')
    expect(liquidEnhancement).not.toContain("[data-testid='todo-panel']")
    expect(liquidEnhancement).toContain('linear-gradient(')
    expect(liquidEnhancement).toContain('inset 0 1px 0 rgb(255 255 255 / 0.42)')
    expect(liquidEnhancement).toContain('contrast(1.04) brightness(1.02)')
  })

  it('makes the same-origin Inspector document participate in the outer glass', () => {
    expect(INSPECTOR_GLASS_CSS).toContain('--sys-color-cdt-base-container: transparent')
    expect(INSPECTOR_GLASS_CSS).toContain('#-blink-dev-tools')
    expect(INSPECTOR_GLASS_CSS).toContain('background: transparent')
    expect(INSPECTOR_GLASS_CSS).not.toContain('opacity:')
  })
})
