/** Install the settings-row stylesheet independently of client-module metadata timing. */
import type { Context } from '@deepseek-ai/cordis'
import componentCss from './BottomGlassRow.module.css?inline'

/**
 * Install the settings component stylesheet for the browser plugin lifetime.
 * @param ctx - browser plugin context.
 */
export function installComponentStyles(ctx: Context): void {
  ctx.effect(() => {
    /* v8 ignore next -- browser plugin startup always has a document. */
    if (typeof document === 'undefined') return () => {}
    const style = document.createElement('style')
    style.dataset.plugin = 'dsh-bottom-glass'
    style.dataset.path = 'bottom-glass.component.css'
    style.textContent = componentCss
    document.head.append(style)
    return () => { style.remove() }
  }, 'bottom-glass: component styles')
}
