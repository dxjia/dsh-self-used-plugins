/** Ordered settings writes and visible save feedback for terminal appearance. */
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import type { ConfigForm } from '@deepseek-ai/dsh-client-ui-settings/client'
import type { AppearanceMode, PresetId, TerminalAppearanceSettings } from '../settings.ts'

/** Save state shared by the settings row. */
export interface AppearanceMutation {
  /** Whether a settings write is in flight. */
  busy: boolean
  /** Last settled result. */
  notice: 'saved' | 'failed' | null
  /** Monotonic identity for repeated notices. */
  sequence: number
}

/** Persist terminal appearance without publishing an optimistic terminal selection. */
export class TerminalAppearancePreference {
  /** Observable save state. */
  readonly state = createSnapshotStore<AppearanceMutation>({ busy: false, notice: null, sequence: 0 })

  /** @param form - Host-owned appearance settings form. */
  constructor(private readonly form: ConfigForm<TerminalAppearanceSettings>) {}

  /**
   * Save one palette selection.
   * @param preset - selected palette id.
   * @returns settlement after the Host answers.
   */
  setPreset(preset: PresetId): Promise<void> {
    return this.write(() => this.form.set('preset', preset))
  }

  /**
   * Save one color mode.
   * @param mode - selected variant mode.
   * @returns settlement after the Host answers.
   */
  setMode(mode: AppearanceMode): Promise<void> {
    return this.write(() => this.form.set('mode', mode))
  }

  /**
   * Clear both preferences so the Host schema defaults apply.
   * @returns settlement after the Host answers.
   */
  reset(): Promise<void> {
    return this.write(() => this.form.mutate([
      { op: 'unset', path: ['preset'] },
      { op: 'unset', path: ['mode'] },
    ]))
  }

  private async write(operation: () => Promise<boolean>): Promise<void> {
    if (this.state.getSnapshot().busy) return
    this.state.update((state) => {
      state.busy = true
      state.notice = null
    })
    let accepted = false
    try {
      accepted = await operation()
    } catch (_error) {
      // The row reports the failed write while the form retains the last accepted value.
    }
    this.state.update((state) => {
      state.busy = false
      state.notice = accepted ? 'saved' : 'failed'
      state.sequence += 1
    })
  }
}
