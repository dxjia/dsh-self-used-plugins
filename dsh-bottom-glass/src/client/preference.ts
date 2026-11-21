/** Ordered settings writes and visible save feedback for bottom glass. */
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import type { ConfigForm } from '@deepseek-ai/dsh-client-ui-settings/client'
import type { BottomGlassSettings } from '../settings.ts'

/** Save state shared by the settings row. */
export interface BottomGlassMutation {
  /** Whether at least one settings write is unsettled. */
  busy: boolean
  /** Last settled result. */
  notice: 'saved' | 'failed' | null
  /** Monotonic identity for repeated notices. */
  sequence: number
}

/** Persist bottom-glass settings without publishing optimistic saved values. */
export class BottomGlassPreference {
  /** Observable save state. */
  readonly state = createSnapshotStore<BottomGlassMutation>({ busy: false, notice: null, sequence: 0 })
  private pending = 0
  private request = 0

  /** @param form - Host-owned bottom-glass settings form. */
  constructor(private readonly form: ConfigForm<BottomGlassSettings>) {}

  /**
   * Save whether the bottom slot receives the glass treatment.
   * @param enabled - requested enabled state.
   * @returns settlement after the Host answers.
   */
  setEnabled(enabled: boolean): Promise<void> {
    return this.write(() => this.form.set('enabled', enabled))
  }

  /**
   * Save whether the Liquid Glass-inspired highlights are enabled.
   * @param liquidGlass - requested highlight state.
   * @returns settlement after the Host answers.
   */
  setLiquidGlass(liquidGlass: boolean): Promise<void> {
    return this.write(() => this.form.set('liquidGlass', liquidGlass))
  }

  /**
   * Save background opacity.
   * @param opacity - opacity percentage.
   * @returns settlement after the Host answers.
   */
  setOpacity(opacity: number): Promise<void> {
    return this.write(() => this.form.set('opacity', opacity))
  }

  /**
   * Save backdrop blur.
   * @param blur - blur radius in pixels.
   * @returns settlement after the Host answers.
   */
  setBlur(blur: number): Promise<void> {
    return this.write(() => this.form.set('blur', blur))
  }

  /**
   * Save backdrop saturation.
   * @param saturation - saturation percentage.
   * @returns settlement after the Host answers.
   */
  setSaturation(saturation: number): Promise<void> {
    return this.write(() => this.form.set('saturation', saturation))
  }

  /**
   * Clear all overrides so Host defaults apply.
   * @returns settlement after the Host answers.
   */
  reset(): Promise<void> {
    return this.write(() => this.form.mutate([
      { op: 'unset', path: ['enabled'] },
      { op: 'unset', path: ['liquidGlass'] },
      { op: 'unset', path: ['opacity'] },
      { op: 'unset', path: ['blur'] },
      { op: 'unset', path: ['saturation'] },
    ]))
  }

  private async write(operation: () => Promise<boolean>): Promise<void> {
    const request = ++this.request
    this.pending += 1
    this.state.update((state) => {
      state.busy = true
      state.notice = null
    })
    let accepted = false
    try {
      accepted = await operation()
    } catch (_error) {
      // The row reports the failed write while the form retains the last accepted value.
    } finally {
      this.pending -= 1
      if (request === this.request) {
        this.state.update((state) => {
          state.busy = this.pending > 0
          state.notice = accepted ? 'saved' : 'failed'
          state.sequence += 1
        })
      }
    }
  }
}
