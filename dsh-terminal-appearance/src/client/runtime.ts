/** Install and retire the scoped terminal color stylesheet. */
import type { ObservableSnapshot } from '@deepseek-ai/dsh-client-store'
import type { ConfigForm } from '@deepseek-ai/dsh-client-ui-settings/client'
import type { ThemeSnapshot } from '@deepseek-ai/dsh-client-ui-theme/client'
import { renderTerminalAppearanceCss } from '../appearance-css.ts'
import { createInlineAnsiPainter } from '../inline-ansi.ts'
import { resolveTerminalPalette } from '../palettes.ts'
import { DEFAULT_TERMINAL_APPEARANCE, isTerminalAppearanceSettings } from '../settings.ts'

/**
 * Install the current palette and follow settings or theme changes until disposed.
 * @param form - Host-owned appearance settings form.
 * @param theme - current theme snapshot source.
 * @returns disposer removing the style, subscriptions, and owning plugin attribute.
 */
export function installTerminalAppearance(
  form: ConfigForm<unknown>,
  theme: ObservableSnapshot<ThemeSnapshot>,
): () => void {
  /* v8 ignore next -- browser plugin startup always has a document; the Node client face does not call this function. */
  if (typeof document === 'undefined') return () => {}
  const style = document.createElement('style')
  style.dataset.plugin = 'dsh-terminal-appearance'
  style.dataset.path = 'terminal-appearance.runtime.css'
  document.head.append(style)
  const inlineAnsi = createInlineAnsiPainter()
  const sync = (): void => {
    const value = form.getSnapshot().value
    const settings = isTerminalAppearanceSettings(value) ? value : DEFAULT_TERMINAL_APPEARANCE
    const palette = resolveTerminalPalette(
      settings.preset,
      settings.mode,
      theme.getSnapshot().active.colorScheme,
    )
    style.textContent = palette === undefined ? '' : renderTerminalAppearanceCss(palette)
    style.dataset.preset = settings.preset
    style.dataset.mode = settings.mode
    if (palette === undefined) style.removeAttribute('data-active')
    else style.dataset.active = ''
    inlineAnsi.update(palette)
  }
  const stopForm = form.subscribe(sync)
  const stopTheme = theme.subscribe(sync)
  sync()
  return () => {
    stopForm()
    stopTheme()
    inlineAnsi.dispose()
    style.remove()
  }
}
