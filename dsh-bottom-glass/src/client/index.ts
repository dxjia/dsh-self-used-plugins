/** Browser registration for bottom-slot glass settings and runtime styles. */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import {
  BOTTOM_GLASS_NAMESPACE,
  type BottomGlassSettings,
} from '../settings.ts'
import {
  BottomGlassRow,
  type BottomGlassRowInjected,
} from './BottomGlassRow.tsx'
import { installComponentStyles } from './component-styles.ts'
import { de, en, es, fr, ja, pt, ru, zh } from './locales.ts'
import { BottomGlassPreference } from './preference.ts'
import { installBottomGlass } from './runtime.ts'

/** Services required by the settings contribution and bottom-slot styles. */
export const inject = ['slots', 'locale', 'configForms']

const LOCALE = 'bottomGlass'

/**
 * Register the General settings row and keep the bottom-slot stylesheet in sync.
 * @param ctx - browser plugin context.
 */
export function apply(ctx: Context): void {
  installComponentStyles(ctx)
  ctx.effect(() => ctx.locale.register(LOCALE, { zh, en, ja, es, fr, de, ru, pt }), 'bottom-glass: copy')
  const form = ctx.configForms.get<BottomGlassSettings>(BOTTOM_GLASS_NAMESPACE)
  const preference = new BottomGlassPreference(form)
  const face = (): BottomGlassRowInjected => ({
    hooks: { appearance: form, mutation: preference.state },
    setEnabled: enabled => preference.setEnabled(enabled),
    setOpacity: opacity => preference.setOpacity(opacity),
    setBlur: blur => preference.setBlur(blur),
    setSaturation: saturation => preference.setSaturation(saturation),
    reset: () => preference.reset(),
  })
  ctx.effect(() => ctx.configForms.whileServed([BOTTOM_GLASS_NAMESPACE], () =>
    installBottomGlass(form)), 'bottom-glass: runtime styles')
  ctx.effect(() => ctx.configForms.whileServed([BOTTOM_GLASS_NAMESPACE], () =>
    ctx.slots.inject('settings.general.item', () => ctx.slots.register({
      name: 'settings.general.item',
      id: BOTTOM_GLASS_NAMESPACE,
      order: 13,
      locale: LOCALE,
      inject: face,
    }, BottomGlassRow))), 'bottom-glass: settings row')
}
