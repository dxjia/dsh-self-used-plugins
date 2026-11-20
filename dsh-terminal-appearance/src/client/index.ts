/** Browser registration for the terminal appearance settings and scoped stylesheet. */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-theme/client'
import {
  TERMINAL_APPEARANCE_NAMESPACE,
  type TerminalAppearanceSettings,
} from '../settings.ts'
import { TerminalAppearancePreference } from './preference.ts'
import { installTerminalAppearance } from './runtime.ts'
import { TerminalAppearanceRow, type TerminalAppearanceInjected } from './TerminalAppearanceRow.tsx'
import { installComponentStyles } from './component-styles.ts'
import { de, en, es, fr, ja, pt, ru, zh } from './locales.ts'

/** Services required by the settings contribution and terminal-only stylesheet. */
export const inject = ['slots', 'locale', 'configForms', 'theme']

const LOCALE = 'terminalAppearance'

/**
 * Register the General settings row and keep the scoped terminal stylesheet in sync.
 * @param ctx - browser plugin context.
 */
export function apply(ctx: Context): void {
  installComponentStyles(ctx)
  ctx.effect(() => ctx.locale.register(LOCALE, { zh, en, ja, es, fr, de, ru, pt }), 'terminal-appearance: copy')
  const form = ctx.configForms.get<TerminalAppearanceSettings>(TERMINAL_APPEARANCE_NAMESPACE)
  const preference = new TerminalAppearancePreference(form)
  const theme = {
    getSnapshot: () => ctx.theme.getTheme(),
    subscribe: (listener: () => void) => ctx.on('theme/change', () => { listener() }),
  }
  const face = (): TerminalAppearanceInjected => ({
    hooks: { appearance: form, theme, mutation: preference.state },
    setPreset: preset => preference.setPreset(preset),
    setMode: mode => preference.setMode(mode),
    reset: () => preference.reset(),
    setFontSize: px => { ctx.theme.setFontSize('terminal', px) },
    setFontFamily: value => { ctx.theme.setFontFamily('terminal', value) },
  })
  ctx.effect(() => ctx.configForms.whileServed([TERMINAL_APPEARANCE_NAMESPACE], () =>
    installTerminalAppearance(form, theme)), 'terminal-appearance: runtime colors')
  ctx.effect(() => ctx.configForms.whileServed([TERMINAL_APPEARANCE_NAMESPACE], () =>
    ctx.slots.inject('settings.general.item', () => ctx.slots.register({
      name: 'settings.general.item',
      id: TERMINAL_APPEARANCE_NAMESPACE,
      order: 12,
      locale: LOCALE,
      inject: face,
    }, TerminalAppearanceRow))), 'terminal-appearance: settings row')
}
