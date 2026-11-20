/** Values shared by the Host schema and browser chat appearance layer. */

/** Supported user-message surfaces. */
export const MESSAGE_STYLES = ['bubble', 'solid', 'image'] as const

/** One user-message surface. */
export type MessageStyle = typeof MESSAGE_STYLES[number]

/** Bundled background-image presets. */
export const BACKGROUND_PRESETS = ['dusk', 'ocean', 'night', 'custom'] as const

/** One background-image source. */
export type BackgroundPreset = typeof BACKGROUND_PRESETS[number]

/** Settings namespace owned by this plugin. */
export const CHAT_APPEARANCE_NAMESPACE = 'im-chat-appearance'

/** Valid default accent color. */
export const DEFAULT_ACCENT = '#5b8cff'

/** Durable chat appearance preferences. */
export interface ChatAppearanceSettings {
  style: MessageStyle
  accent: string
  showNames: boolean
  senderName: string
  backgroundPreset: BackgroundPreset
  customImageId: string
}

/** Values used before the Host settings document is available. */
export const DEFAULT_CHAT_APPEARANCE: ChatAppearanceSettings = Object.freeze({
  style: 'bubble',
  accent: DEFAULT_ACCENT,
  showNames: true,
  senderName: 'Jia',
  backgroundPreset: 'dusk',
  customImageId: '',
})

/**
 * Test whether a value is a six-digit hexadecimal color.
 * @param value - candidate value.
 * @returns whether the value is a supported accent color.
 */
export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/iu.test(value)
}

/**
 * Normalize partially persisted settings into a complete runtime object.
 * @param value - unknown settings form value.
 * @returns valid settings, using defaults for missing or invalid fields.
 */
export function normalizeChatAppearanceSettings(value: unknown): ChatAppearanceSettings {
  if (typeof value !== 'object' || value === null) return DEFAULT_CHAT_APPEARANCE
  const candidate = value as Partial<ChatAppearanceSettings>
  const sender = typeof candidate.senderName === 'string'
    ? candidate.senderName.trim().slice(0, 40)
    : DEFAULT_CHAT_APPEARANCE.senderName
  return {
    style: MESSAGE_STYLES.includes(candidate.style as MessageStyle)
      ? candidate.style as MessageStyle
      : DEFAULT_CHAT_APPEARANCE.style,
    accent: isHexColor(candidate.accent) ? candidate.accent : DEFAULT_CHAT_APPEARANCE.accent,
    showNames: typeof candidate.showNames === 'boolean'
      ? candidate.showNames
      : DEFAULT_CHAT_APPEARANCE.showNames,
    senderName: sender === '' ? DEFAULT_CHAT_APPEARANCE.senderName : sender,
    backgroundPreset: BACKGROUND_PRESETS.includes(candidate.backgroundPreset as BackgroundPreset)
      ? candidate.backgroundPreset as BackgroundPreset
      : DEFAULT_CHAT_APPEARANCE.backgroundPreset,
    customImageId: typeof candidate.customImageId === 'string'
      ? candidate.customImageId.slice(0, 128)
      : '',
  }
}
