import { describe, expect, it } from 'vitest'
import {
  BOTTOM_GLASS_LIMITS,
  DEFAULT_BOTTOM_GLASS,
  normalizeBottomGlassSettings,
} from '../src/settings.ts'

describe('bottom-glass settings', () => {
  it('uses a visible glass treatment by default', () => {
    expect(DEFAULT_BOTTOM_GLASS).toEqual({
      enabled: true,
      opacity: 48,
      blur: 24,
      saturation: 140,
    })
  })

  it('clamps persisted numeric values to supported ranges', () => {
    expect(normalizeBottomGlassSettings({
      enabled: false,
      opacity: 2,
      blur: 99,
      saturation: 260,
    })).toEqual({
      enabled: false,
      opacity: BOTTOM_GLASS_LIMITS.opacity.min,
      blur: BOTTOM_GLASS_LIMITS.blur.max,
      saturation: BOTTOM_GLASS_LIMITS.saturation.max,
    })
  })

  it('falls back from missing or malformed fields', () => {
    expect(normalizeBottomGlassSettings({ opacity: Number.NaN })).toEqual(DEFAULT_BOTTOM_GLASS)
    expect(normalizeBottomGlassSettings(null)).toEqual(DEFAULT_BOTTOM_GLASS)
  })
})
