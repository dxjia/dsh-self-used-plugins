/** Host registration for durable IM-style chat appearance preferences. */
import type { Context, Volatile } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import type {} from '@deepseek-ai/dsh-settings'
import {
  BACKGROUND_PRESETS,
  DEFAULT_ACCENT,
  DEFAULT_CHAT_APPEARANCE,
  MESSAGE_STYLES,
  type BackgroundPreset,
  type MessageStyle,
} from './settings.ts'

/** Runtime chat appearance preferences projected to the browser. */
export interface Config {
  style: Volatile<MessageStyle>
  accent: Volatile<string>
  showNames: Volatile<boolean>
  senderName: Volatile<string>
  backgroundPreset: Volatile<BackgroundPreset>
  customImageId: Volatile<string>
}

/** Live settings schema shared with Web and Desktop clients. */
export const Config = z.object({
  style: z.union([...MESSAGE_STYLES]).default(DEFAULT_CHAT_APPEARANCE.style).volatile(),
  accent: z.string().pattern(/^#[0-9a-f]{6}$/iu).default(DEFAULT_ACCENT).volatile(),
  showNames: z.boolean().default(DEFAULT_CHAT_APPEARANCE.showNames).volatile(),
  senderName: z.string().default(DEFAULT_CHAT_APPEARANCE.senderName).volatile(),
  backgroundPreset: z.union([...BACKGROUND_PRESETS]).default(DEFAULT_CHAT_APPEARANCE.backgroundPreset).volatile(),
  customImageId: z.string().default('').volatile(),
})

/**
 * Register IM chat appearance preferences with the Host settings document.
 * @param ctx - Host plugin context.
 */
export function apply(ctx: Context): void {
  ctx.inject(['settings'], (child) => {
    child.effect(() => child.settings.configure({ auto: false }, ctx.fiber), 'im-chat-appearance: settings')
  })
}
