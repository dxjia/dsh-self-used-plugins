import { afterEach, describe, expect, it, vi } from 'vitest'
import { MAX_NOTES, createNoteState, defaultNoteState, normalizeNoteState } from '../src/client/state.ts'

/** Minimal localStorage stand-in for the migration and persistence paths. */
function stubStorage(entries: Record<string, string> = {}): Map<string, string> {
  const store = new Map<string, string>(Object.entries(entries))
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value) },
    removeItem: (key: string) => { store.delete(key) },
  })
  return store
}

describe('floating note state', () => {
  afterEach(() => { vi.unstubAllGlobals() })

  it('uses defaults for missing or invalid persisted fields', () => {
    const defaults = defaultNoteState()
    expect(normalizeNoteState(null)).toEqual(defaults)
    expect(normalizeNoteState({ enabled: true, fontSize: 99, opacity: 0.1, color: 'red', notes: [] })).toMatchObject({
      enabled: true,
      fontSize: 32,
      opacity: 0.4,
      color: defaults.color,
      notes: [],
    })
  })

  it('migrates the single-note entry into the first window', () => {
    const state = normalizeNoteState({ enabled: true, text: 'idea', left: 40, top: 90, width: 300, height: 260 })
    expect(state.notes).toEqual([{ id: 'note-1', text: 'idea', left: 40, top: 90, width: 300, height: 260 }])
  })

  it('renumbers unusable ids and stops at the note limit', () => {
    const state = normalizeNoteState({
      notes: [
        { id: 'note-2', text: 'b' },
        { id: 'note-2', text: 'duplicate id' },
        { id: 'nope', text: 'invalid id' },
        { text: 'no id' },
        { text: 'one too many' },
      ],
    })
    expect(state.notes.map(note => note.id)).toEqual(['note-2', 'note-1', 'note-3', 'note-4', 'note-5'])
    expect(normalizeNoteState({
      notes: Array.from({ length: MAX_NOTES + 2 }, (_, index) => ({ id: `note-${String(index + 1)}` })),
    }).notes).toHaveLength(MAX_NOTES)
  })

  it('clamps restored note frames', () => {
    const state = normalizeNoteState({ notes: [{ id: 'note-1', left: -20, top: 4, width: 1_000, height: 1 }] })
    expect(state.notes[0]).toMatchObject({ left: 8, top: 48, width: 720, height: 220 })
  })

  it('creates notes up to the limit and keeps each text separate', () => {
    const note = createNoteState()
    expect(note.store.getSnapshot().notes).toHaveLength(0)

    note.actions.setEnabled(true)
    expect(note.store.getSnapshot()).toMatchObject({ enabled: true })
    expect(note.store.getSnapshot().notes.map(entry => entry.id)).toEqual(['note-1'])

    for (let index = 1; index < MAX_NOTES; index += 1) note.actions.addNote()
    expect(note.store.getSnapshot().notes.map(entry => entry.id))
      .toEqual(['note-1', 'note-2', 'note-3', 'note-4', 'note-5'])
    note.actions.addNote()
    expect(note.store.getSnapshot().notes).toHaveLength(MAX_NOTES)

    note.actions.setText('note-1', 'first')
    note.actions.setText('note-4', 'fourth')
    const notes = note.store.getSnapshot().notes
    expect(notes.map(entry => entry.text)).toEqual(['first', '', '', 'fourth', ''])
  })

  it('drops only the closed note and reuses its number', () => {
    const note = createNoteState()
    note.actions.addNote()
    note.actions.addNote()

    note.actions.removeNote('note-1')
    expect(note.store.getSnapshot().notes.map(entry => entry.id)).toEqual(['note-2'])

    note.actions.addNote()
    expect(note.store.getSnapshot().notes.map(entry => entry.id)).toEqual(['note-2', 'note-1'])
  })

  it('raises the interacted note above its siblings', () => {
    const note = createNoteState()
    for (let index = 0; index < 3; index += 1) note.actions.addNote()

    note.actions.raiseNote('note-1')
    expect(note.store.getSnapshot().notes.map(entry => entry.id)).toEqual(['note-2', 'note-3', 'note-1'])
    note.actions.raiseNote('note-1')
    expect(note.store.getSnapshot().notes.map(entry => entry.id)).toEqual(['note-2', 'note-3', 'note-1'])
  })

  it('adopts a stored single-note entry and writes it back under the current key', () => {
    const storage = stubStorage({
      'dsh.floating-note.v1': JSON.stringify({ enabled: true, text: 'legacy', left: 60, top: 110 }),
    })
    const note = createNoteState()
    expect(note.store.getSnapshot()).toMatchObject({ enabled: true })
    expect(note.store.getSnapshot().notes[0]).toMatchObject({ id: 'note-1', text: 'legacy', left: 60, top: 110 })

    const written = JSON.parse(storage.get('dsh.floating-note.v2') ?? '{}') as { notes?: { text?: string }[] }
    expect(written.notes?.[0]?.text).toBe('legacy')
  })

  it('prefers the current entry over the legacy one', () => {
    stubStorage({
      'dsh.floating-note.v1': JSON.stringify({ enabled: true, text: 'legacy' }),
      'dsh.floating-note.v2': JSON.stringify({ enabled: true, notes: [{ id: 'note-2', text: 'current' }] }),
    })
    expect(createNoteState().store.getSnapshot().notes).toEqual([
      { id: 'note-2', text: 'current', left: 24, top: 72, width: 340, height: 360 },
    ])
  })

  it('clamps window and appearance edits', () => {
    const note = createNoteState()
    note.actions.addNote()
    note.actions.moveNote('note-1', -20, 4)
    note.actions.resizeNote('note-1', 1_000, 1)
    note.actions.setFontSize(100)
    note.actions.setOpacity(0)
    note.actions.setColor('red')
    expect(note.store.getSnapshot()).toMatchObject({
      fontSize: 32,
      opacity: 0.4,
      color: defaultNoteState().color,
      notes: [{ id: 'note-1', left: 8, top: 48, width: 720, height: 220 }],
    })
  })
})