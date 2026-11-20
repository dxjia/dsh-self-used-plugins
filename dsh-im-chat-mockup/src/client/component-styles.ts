/** Install settings-row styles independently of client-module metadata timing. */
import type { Context } from '@deepseek-ai/cordis'
import componentCss from './ChatAppearanceRow.module.css?inline'

/**
 * Install the settings component stylesheet for the browser plugin lifetime.
 * @param ctx - browser plugin context.
 */
export function installComponentStyles(ctx: Context): void {
  ctx.effect(() => {
    /* v8 ignore next -- browser plugin startup always has a document. */
    if (typeof document === 'undefined') return () => {}
    const style = document.createElement('style')
    style.dataset.plugin = 'dsh-im-chat-mockup'
    style.dataset.path = 'im-chat-appearance.component.css'
    style.textContent = componentCss
    document.head.append(style)
    return () => { style.remove() }
  }, 'im-chat-appearance: component styles')
}
