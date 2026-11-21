/** Values shared by the Host schema, settings row, and bottom-slot styles. */

/** Settings namespace owned by this plugin. */
export const BOTTOM_GLASS_NAMESPACE = 'bottom-glass'

/** Supported numeric ranges and defaults for the glass treatment. */
export const BOTTOM_GLASS_LIMITS = Object.freeze({
  opacity: Object.freeze({ min: 20, max: 100, default: 48 }),
  blur: Object.freeze({ min: 0, max: 40, default: 24 }),
  saturation: Object.freeze({ min: 100, max: 180, default: 140 }),
})

/** Durable bottom-slot glass preference. */
export interface BottomGlassSettings {
  /** Whether the plugin paints the full-width bottom slot. */
  enabled: boolean
  /** Background paint opacity in percent. */
  opacity: number
  /** Backdrop blur radius in pixels. */
  blur: number
  /** Backdrop saturation in percent. */
  saturation: number
}

/** Values used before the Host settings document is available. */
export const DEFAULT_BOTTOM_GLASS: BottomGlassSettings = Object.freeze({
  enabled: true,
  opacity: BOTTOM_GLASS_LIMITS.opacity.default,
  blur: BOTTOM_GLASS_LIMITS.blur.default,
  saturation: BOTTOM_GLASS_LIMITS.saturation.default,
})

function boundedInteger(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.round(Math.min(max, Math.max(min, value)))
}

/**
 * Normalize persisted or partially loaded settings into a complete preference.
 * @param value - candidate settings value.
 * @returns settings with every numeric field clamped to its supported range.
 */
export function normalizeBottomGlassSettings(value: unknown): BottomGlassSettings {
  if (typeof value !== 'object' || value === null) return { ...DEFAULT_BOTTOM_GLASS }
  const candidate = value as Partial<BottomGlassSettings>
  return {
    enabled: typeof candidate.enabled === 'boolean' ? candidate.enabled : DEFAULT_BOTTOM_GLASS.enabled,
    opacity: boundedInteger(
      candidate.opacity,
      DEFAULT_BOTTOM_GLASS.opacity,
      BOTTOM_GLASS_LIMITS.opacity.min,
      BOTTOM_GLASS_LIMITS.opacity.max,
    ),
    blur: boundedInteger(
      candidate.blur,
      DEFAULT_BOTTOM_GLASS.blur,
      BOTTOM_GLASS_LIMITS.blur.min,
      BOTTOM_GLASS_LIMITS.blur.max,
    ),
    saturation: boundedInteger(
      candidate.saturation,
      DEFAULT_BOTTOM_GLASS.saturation,
      BOTTOM_GLASS_LIMITS.saturation.min,
      BOTTOM_GLASS_LIMITS.saturation.max,
    ),
  }
}
