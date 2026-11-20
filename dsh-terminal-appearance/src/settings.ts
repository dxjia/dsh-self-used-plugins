/** Values shared by the Host schema and browser appearance layer. */

/** Built-in terminal palette identifiers. */
export const PRESET_IDS = ['dsh', 'homebrew', 'graphite', 'nord', 'tokyo-night', 'solarized', 'gruvbox'] as const

/** One selectable terminal palette. */
export type PresetId = typeof PRESET_IDS[number]

/** How a preset chooses its light or dark variant. */
export const APPEARANCE_MODES = ['follow', 'dark', 'light'] as const

/** One terminal appearance mode. */
export type AppearanceMode = typeof APPEARANCE_MODES[number]

/** Settings namespace owned by this plugin. */
export const TERMINAL_APPEARANCE_NAMESPACE = 'terminal-appearance'

/** Durable terminal appearance preference. */
export interface TerminalAppearanceSettings {
  /** Selected palette. `dsh` leaves the built-in terminal theme untouched. */
  preset: PresetId
  /** Variant selection. `follow` uses the active application light or dark scheme. */
  mode: AppearanceMode
}

/** Values used before the Host settings document is available. */
export const DEFAULT_TERMINAL_APPEARANCE: TerminalAppearanceSettings = Object.freeze({
  preset: 'dsh',
  mode: 'follow',
})

/**
 * Narrow a value read from an appearance settings form.
 * @param value - candidate settings value.
 * @returns whether the value is a supported terminal appearance preference.
 */
export function isTerminalAppearanceSettings(value: unknown): value is TerminalAppearanceSettings {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<TerminalAppearanceSettings>
  return PRESET_IDS.includes(candidate.preset as PresetId)
    && APPEARANCE_MODES.includes(candidate.mode as AppearanceMode)
}
