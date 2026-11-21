/** Host registration for durable full-width bottom-slot glass preferences. */
import type { Context, Volatile } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import type {} from '@deepseek-ai/dsh-settings'
import { BOTTOM_GLASS_LIMITS, DEFAULT_BOTTOM_GLASS } from './settings.ts'

/** Runtime bottom-slot glass preferences projected to the browser. */
export interface Config {
  /** Whether the full-width bottom slot receives the glass treatment. */
  enabled: Volatile<boolean>
  /** Whether surfaces receive the Liquid Glass-inspired highlight treatment. */
  liquidGlass: Volatile<boolean>
  /** Background paint opacity in percent. */
  opacity: Volatile<number>
  /** Backdrop blur radius in pixels. */
  blur: Volatile<number>
  /** Backdrop saturation in percent. */
  saturation: Volatile<number>
}

/** Live settings schema shared with Web and Desktop clients. */
export const Config = z.object({
  enabled: z.boolean().default(DEFAULT_BOTTOM_GLASS.enabled).volatile(),
  liquidGlass: z.boolean().default(DEFAULT_BOTTOM_GLASS.liquidGlass).volatile(),
  opacity: z.number().step(1)
    .min(BOTTOM_GLASS_LIMITS.opacity.min)
    .max(BOTTOM_GLASS_LIMITS.opacity.max)
    .default(DEFAULT_BOTTOM_GLASS.opacity)
    .volatile(),
  blur: z.number().step(1)
    .min(BOTTOM_GLASS_LIMITS.blur.min)
    .max(BOTTOM_GLASS_LIMITS.blur.max)
    .default(DEFAULT_BOTTOM_GLASS.blur)
    .volatile(),
  saturation: z.number().step(1)
    .min(BOTTOM_GLASS_LIMITS.saturation.min)
    .max(BOTTOM_GLASS_LIMITS.saturation.max)
    .default(DEFAULT_BOTTOM_GLASS.saturation)
    .volatile(),
})

/**
 * Register the bottom-glass preference with the Host settings document.
 * @param ctx - Host plugin context.
 */
export function apply(ctx: Context): void {
  ctx.inject(['settings'], (child) => {
    child.effect(() => child.settings.configure({ auto: false }, ctx.fiber), 'bottom-glass: settings')
  })
}
