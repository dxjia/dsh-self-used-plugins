import { createSnapshotStore, type SnapshotStore } from '@deepseek-ai/dsh-client-store'

/** Upper bound on simultaneously open floating notes. */
export const MAX_NOTES = 5

/** One floating note window: its own text and its own frame on screen. */
export interface NoteWindow {
  /** Stable identity and displayed number, `note-1` … `note-5`. */
  id: string
  text: string
  left: number
  top: number
  width: number
  height: number
}

/** State stored in the browser: shared appearance plus every open note. */
export interface NoteState {
  enabled: boolean
  fontSize: number
  fontFamily: string
  color: string
  opacity: number
  notes: NoteWindow[]
}

/** Actions exposed to the settings page and the floating editors. */
export interface NoteActions {
  setEnabled(enabled: boolean): void
  addNote(): void
  removeNote(id: string): void
  setText(id: string, text: string): void
  moveNote(id: string, left: number, top: number): void
  resizeNote(id: string, width: number, height: number): void
  raiseNote(id: string): void
  setFontSize(fontSize: number): void
  setFontFamily(fontFamily: string): void
  setColor(color: string): void
  setOpacity(opacity: number): void
}

/** Data and callbacks injected into every note surface. */
export interface NoteInjected {
  hooks: { note: SnapshotStore<NoteState> }
  actions: NoteActions
}

const STORAGE_KEY = 'dsh.floating-note.v2'
/** Single-note layout written by earlier versions; read once so its text survives the upgrade. */
const LEGACY_STORAGE_KEY = 'dsh.floating-note.v1'

const NOTE_ID = /^note-([1-5])$/u
const MIN_WIDTH = 260
const MAX_WIDTH = 720
const MIN_HEIGHT = 220
const MAX_HEIGHT = 720
const DEFAULT_WIDTH = 340
const DEFAULT_HEIGHT = 360
/** Gap between a new note and the note it cascades from, so neither hides the other. */
const CASCADE_STEP = 28
const DEFAULT_TOP = 72

function defaultLeft(): number {
  return typeof window === 'undefined' ? 24 : Math.max(24, window.innerWidth - 380)
}

/** Default values used for a new browser profile. */
export function defaultNoteState(): NoteState {
  return {
    enabled: false,
    fontSize: 16,
    fontFamily: 'system-ui',
    color: '#1f2937',
    opacity: 0.94,
    notes: [],
  }
}

function finiteNumber(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback
}

/** Number shown in one note's title, read back from its id. */
export function noteNumber(id: string): number {
  return Number(NOTE_ID.exec(id)?.[1] ?? '1')
}

/** Smallest unused note number, or undefined once all five are taken. */
function freeNoteId(used: ReadonlySet<string>): string | undefined {
  for (let index = 1; index <= MAX_NOTES; index += 1) {
    const id = `note-${String(index)}`
    if (!used.has(id)) return id
  }
  return undefined
}

/** Frame for the next note: cascaded from the topmost one and kept on screen. */
function newNoteFrame(notes: readonly NoteWindow[]): { left: number; top: number } {
  const topmost = notes[notes.length - 1]
  const left = topmost === undefined ? defaultLeft() : topmost.left + CASCADE_STEP
  const top = topmost === undefined ? DEFAULT_TOP : topmost.top + CASCADE_STEP
  if (typeof window === 'undefined') return { left, top }
  return {
    left: left > Math.max(8, window.innerWidth - 160) ? 24 : left,
    top: top > Math.max(DEFAULT_TOP, window.innerHeight - 120) ? DEFAULT_TOP : top,
  }
}

/** Create an empty note when the window budget allows one. */
function createNote(notes: readonly NoteWindow[]): NoteWindow | undefined {
  const id = freeNoteId(new Set(notes.map(note => note.id)))
  if (id === undefined) return undefined
  return {
    id,
    text: '',
    ...newNoteFrame(notes),
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  }
}

/** Apply a mutation to one note, ignoring ids that no longer exist. */
function editNote(state: NoteState, id: string, mutate: (note: NoteWindow) => void): void {
  const note = state.notes.find(candidate => candidate.id === id)
  if (note !== undefined) mutate(note)
}

function normalizeNote(raw: Record<string, unknown>, used: ReadonlySet<string>): NoteWindow | undefined {
  const declared = typeof raw.id === 'string' && NOTE_ID.test(raw.id) && !used.has(raw.id) ? raw.id : undefined
  const id = declared ?? freeNoteId(used)
  if (id === undefined) return undefined
  return {
    id,
    text: typeof raw.text === 'string' ? raw.text : '',
    left: finiteNumber(raw.left, defaultLeft(), 8, 20000),
    top: finiteNumber(raw.top, DEFAULT_TOP, 48, 20000),
    width: finiteNumber(raw.width, DEFAULT_WIDTH, MIN_WIDTH, MAX_WIDTH),
    height: finiteNumber(raw.height, DEFAULT_HEIGHT, MIN_HEIGHT, MAX_HEIGHT),
  }
}

function normalizeNotes(candidate: Record<string, unknown>): NoteWindow[] {
  // The single-note entry carried one note's fields at the top level.
  const entries = Array.isArray(candidate.notes)
    ? candidate.notes
    : typeof candidate.text === 'string' ? [candidate] : []
  const used = new Set<string>()
  const notes: NoteWindow[] = []
  for (const entry of entries) {
    if (typeof entry !== 'object' || entry === null) continue
    const note = normalizeNote(entry as Record<string, unknown>, used)
    if (note === undefined) break
    used.add(note.id)
    notes.push(note)
  }
  return notes
}

/** Normalize data recovered from an older or partially written local entry. */
export function normalizeNoteState(value: unknown): NoteState {
  const defaults = defaultNoteState()
  if (typeof value !== 'object' || value === null) return defaults
  const candidate = value as Record<string, unknown>
  return {
    enabled: typeof candidate.enabled === 'boolean' ? candidate.enabled : defaults.enabled,
    fontSize: finiteNumber(candidate.fontSize, defaults.fontSize, 12, 32),
    fontFamily: typeof candidate.fontFamily === 'string' && candidate.fontFamily !== ''
      ? candidate.fontFamily : defaults.fontFamily,
    color: typeof candidate.color === 'string' && /^#[\da-f]{6}$/iu.test(candidate.color)
      ? candidate.color : defaults.color,
    opacity: finiteNumber(candidate.opacity, defaults.opacity, 0.4, 1),
    notes: normalizeNotes(candidate),
  }
}

/** Read one persisted entry, treating corruption and unavailable storage as a first run. */
function readStored(key: string): unknown {
  if (typeof localStorage === 'undefined') return undefined
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? undefined : JSON.parse(raw) as unknown
  } catch {
    return undefined
  }
}

/** Create the one root-scoped store shared by the settings page and the overlay. */
export function createNoteState(): { store: SnapshotStore<NoteState>; actions: NoteActions } {
  const stored = readStored(STORAGE_KEY)
  const store = createSnapshotStore(defaultNoteState(), { persist: { name: STORAGE_KEY } })
  // The store already rehydrated the current key when it exists; otherwise adopt
  // the single-note entry left behind by the previous version.
  store.set(normalizeNoteState(stored !== undefined ? store.getSnapshot() : readStored(LEGACY_STORAGE_KEY)))
  const actions: NoteActions = {
    setEnabled: enabled => store.update(state => {
      state.enabled = enabled
      if (!enabled || state.notes.length > 0) return
      const note = createNote(state.notes)
      if (note !== undefined) state.notes.push(note)
    }),
    addNote: () => store.update(state => {
      const note = createNote(state.notes)
      if (note === undefined) return
      state.notes.push(note)
      state.enabled = true
    }),
    removeNote: id => store.update(state => {
      state.notes = state.notes.filter(note => note.id !== id)
    }),
    setText: (id, text) => store.update(state => { editNote(state, id, note => { note.text = text }) }),
    moveNote: (id, left, top) => store.update(state => {
      editNote(state, id, note => {
        note.left = Math.max(8, left)
        note.top = Math.max(48, top)
      })
    }),
    resizeNote: (id, width, height) => store.update(state => {
      editNote(state, id, note => {
        note.width = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width))
        note.height = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, height))
      })
    }),
    raiseNote: id => store.update(state => {
      const index = state.notes.findIndex(note => note.id === id)
      if (index === -1 || index === state.notes.length - 1) return
      const [raised] = state.notes.splice(index, 1)
      if (raised !== undefined) state.notes.push(raised)
    }),
    setFontSize: fontSize => store.update(state => { state.fontSize = Math.min(32, Math.max(12, fontSize)) }),
    setFontFamily: fontFamily => store.update(state => { state.fontFamily = fontFamily }),
    setColor: color => store.update(state => { if (/^#[\da-f]{6}$/iu.test(color)) state.color = color }),
    setOpacity: opacity => store.update(state => { state.opacity = Math.min(1, Math.max(0.4, opacity)) }),
  }
  return { store, actions }
}
