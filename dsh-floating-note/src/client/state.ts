import { createSnapshotStore, type SnapshotStore } from '@deepseek-ai/dsh-client-store'

/** State stored in the browser for one floating note. */
export interface NoteState {
  enabled: boolean
  text: string
  fontSize: number
  fontFamily: string
  color: string
  opacity: number
  left: number
  top: number
  width: number
  height: number
}

/** Actions exposed to the settings page and the floating editor. */
export interface NoteActions {
  setEnabled(enabled: boolean): void
  setText(text: string): void
  setFontSize(fontSize: number): void
  setFontFamily(fontFamily: string): void
  setColor(color: string): void
  setOpacity(opacity: number): void
  setPosition(left: number, top: number): void
  setSize(width: number, height: number): void
}

/** Data and callbacks injected into every note surface. */
export interface NoteInjected {
  hooks: { note: SnapshotStore<NoteState> }
  actions: NoteActions
}

const STORAGE_KEY = 'dsh.floating-note.v1'

function defaultLeft(): number {
  return typeof window === 'undefined' ? 24 : Math.max(24, window.innerWidth - 380)
}

/** Default values used for a new browser profile. */
export function defaultNoteState(): NoteState {
  return {
    enabled: false,
    text: '',
    fontSize: 16,
    fontFamily: 'system-ui',
    color: '#1f2937',
    opacity: 0.94,
    left: defaultLeft(),
    top: 72,
    width: 340,
    height: 360,
  }
}

function finiteNumber(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback
}

/** Normalize data recovered from an older or partially written local entry. */
export function normalizeNoteState(value: unknown): NoteState {
  if (typeof value !== 'object' || value === null) return defaultNoteState()
  const candidate = value as Partial<NoteState>
  const defaults = defaultNoteState()
  return {
    enabled: typeof candidate.enabled === 'boolean' ? candidate.enabled : defaults.enabled,
    text: typeof candidate.text === 'string' ? candidate.text : defaults.text,
    fontSize: finiteNumber(candidate.fontSize, defaults.fontSize, 12, 32),
    fontFamily: typeof candidate.fontFamily === 'string' && candidate.fontFamily !== ''
      ? candidate.fontFamily : defaults.fontFamily,
    color: typeof candidate.color === 'string' && /^#[\da-f]{6}$/iu.test(candidate.color)
      ? candidate.color : defaults.color,
    opacity: finiteNumber(candidate.opacity, defaults.opacity, 0.4, 1),
    left: finiteNumber(candidate.left, defaults.left, 8, 20000),
    top: finiteNumber(candidate.top, defaults.top, 48, 20000),
    width: finiteNumber(candidate.width, defaults.width, 260, 720),
    height: finiteNumber(candidate.height, defaults.height, 220, 720),
  }
}

/** Create the one root-scoped store shared by the settings page and overlay. */
export function createNoteState(): { store: SnapshotStore<NoteState>; actions: NoteActions } {
  const store = createSnapshotStore(defaultNoteState(), { persist: { name: STORAGE_KEY } })
  store.set(normalizeNoteState(store.getSnapshot()))
  const actions: NoteActions = {
    setEnabled: enabled => store.update(state => { state.enabled = enabled }),
    setText: text => store.update(state => { state.text = text }),
    setFontSize: fontSize => store.update(state => { state.fontSize = Math.min(32, Math.max(12, fontSize)) }),
    setFontFamily: fontFamily => store.update(state => { state.fontFamily = fontFamily }),
    setColor: color => store.update(state => { if (/^#[\da-f]{6}$/iu.test(color)) state.color = color }),
    setOpacity: opacity => store.update(state => { state.opacity = Math.min(1, Math.max(0.4, opacity)) }),
    setPosition: (left, top) => store.update(state => {
      state.left = Math.max(8, left)
      state.top = Math.max(48, top)
    }),
    setSize: (width, height) => store.update(state => {
      state.width = Math.min(720, Math.max(260, width))
      state.height = Math.min(720, Math.max(220, height))
    }),
  }
  return { store, actions }
}
