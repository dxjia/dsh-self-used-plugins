/** Ordered writes and save feedback for IM chat appearance settings. */
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import type { ConfigForm } from '@deepseek-ai/dsh-client-ui-settings/client'
import type {
  BackgroundPreset,
  ChatAppearanceSettings,
  MessageStyle,
} from '../settings.ts'

/** Save state shared by the settings row. */
export interface AppearanceMutation {
  busy: boolean
  notice: 'saved' | 'failed' | null
  sequence: number
}

/** Persist appearance preferences without publishing optimistic chat styling. */
export class ChatAppearancePreference {
  readonly state = createSnapshotStore<AppearanceMutation>({ busy: false, notice: null, sequence: 0 })

  /** @param form - Host-owned chat appearance form. */
  constructor(private readonly form: ConfigForm<ChatAppearanceSettings>) {}

  /**
   * Save the user-message surface.
   * @param style - selected surface.
   * @returns whether the Host accepted the write.
   */
  setStyle(style: MessageStyle): Promise<boolean> {
    return this.write(() => this.form.set('style', style))
  }

  /**
   * Save the accent color.
   * @param accent - six-digit hexadecimal color.
   * @returns whether the Host accepted the write.
   */
  setAccent(accent: string): Promise<boolean> {
    return this.write(() => this.form.set('accent', accent))
  }

  /**
   * Save role-name visibility.
   * @param show - whether names are visible.
   * @returns whether the Host accepted the write.
   */
  setShowNames(show: boolean): Promise<boolean> {
    return this.write(() => this.form.set('showNames', show))
  }

  /**
   * Save the configurable sender name.
   * @param name - display name.
   * @returns whether the Host accepted the write.
   */
  setSenderName(name: string): Promise<boolean> {
    return this.write(() => this.form.set('senderName', name.trim().slice(0, 40)))
  }

  /**
   * Save whether long user messages fold behind an expand control.
   * @param collapse - whether overlong messages start folded.
   * @returns whether the Host accepted the write.
   */
  setCollapseLong(collapse: boolean): Promise<boolean> {
    return this.write(() => this.form.set('collapseLong', collapse))
  }

  /**
   * Save a bundled background preset.
   * @param preset - preset identifier.
   * @returns whether the Host accepted the write.
   */
  setBackgroundPreset(preset: BackgroundPreset): Promise<boolean> {
    return this.write(() => this.form.set('backgroundPreset', preset))
  }

  /**
   * Select a locally stored custom image atomically.
   * @param id - local image identifier.
   * @returns whether the Host accepted the write.
   */
  setCustomBackground(id: string): Promise<boolean> {
    return this.write(() => this.form.mutate([
      { op: 'set', path: ['style'], value: 'image' },
      { op: 'set', path: ['backgroundPreset'], value: 'custom' },
      { op: 'set', path: ['customImageId'], value: id },
    ]))
  }

  /**
   * Clear every preference so Host schema defaults apply.
   * @returns whether the Host accepted the mutation.
   */
  reset(): Promise<boolean> {
    return this.write(() => this.form.mutate([
      { op: 'unset', path: ['style'] },
      { op: 'unset', path: ['accent'] },
      { op: 'unset', path: ['showNames'] },
      { op: 'unset', path: ['senderName'] },
      { op: 'unset', path: ['backgroundPreset'] },
      { op: 'unset', path: ['customImageId'] },
      { op: 'unset', path: ['collapseLong'] },
    ]))
  }

  private async write(operation: () => Promise<boolean>): Promise<boolean> {
    if (this.state.getSnapshot().busy) return false
    this.state.update((state) => {
      state.busy = true
      state.notice = null
    })
    let accepted = false
    try {
      accepted = await operation()
    } catch (_error) {
      // The row reports the failed write while the last accepted settings stay in effect.
    }
    this.state.update((state) => {
      state.busy = false
      state.notice = accepted ? 'saved' : 'failed'
      state.sequence += 1
    })
    return accepted
  }
}
