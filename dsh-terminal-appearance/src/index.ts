/** Host registration for durable sidebar terminal appearance preferences. */
import type { Context, Volatile } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import type {} from '@deepseek-ai/dsh-settings'
import {
  APPEARANCE_MODES,
  DEFAULT_TERMINAL_APPEARANCE,
  PRESET_IDS,
  type AppearanceMode,
  type PresetId,
} from './settings.ts'

/** Runtime terminal appearance preferences projected to the browser. */
export interface Config {
  /** Selected terminal palette. */
  preset: Volatile<PresetId>
  /** Palette variant selection. */
  mode: Volatile<AppearanceMode>
}

/** Live settings schema shared with Web and Desktop clients. */
export const Config = z.object({
  preset: z.union([...PRESET_IDS]).default(DEFAULT_TERMINAL_APPEARANCE.preset).volatile(),
  mode: z.union([...APPEARANCE_MODES]).default(DEFAULT_TERMINAL_APPEARANCE.mode).volatile(),
})

/**
 * Register appearance preferences with the Host settings document.
 * @param ctx - Host plugin context.
 */
export function apply(ctx: Context): void {
  ctx.inject(['settings'], (child) => {
    child.effect(() => child.settings.configure({ auto: false }, ctx.fiber), 'terminal-appearance: settings')
  })
}
