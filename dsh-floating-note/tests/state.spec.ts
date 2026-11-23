import { describe, expect, it } from 'vitest'
import { createNoteState, defaultNoteState, normalizeNoteState } from '../src/client/state.ts'

describe('floating note state', () => {
  it('uses defaults for missing or invalid persisted fields', () => {
    const defaults = defaultNoteState()
    expect(normalizeNoteState(null)).toEqual(defaults)
    expect(normalizeNoteState({ enabled: true, fontSize: 99, opacity: 0.1, color: 'red' })).toMatchObject({
      enabled: true,
      fontSize: 32,
      opacity: 0.4,
      color: defaults.color,
    })
  })

  it('clamps display actions and keeps text edits intact', () => {
    const note = createNoteState()
    note.actions.setText('idea')
    note.actions.setFontSize(100)
    note.actions.setOpacity(0)
    note.actions.setPosition(-20, 4)
    note.actions.setSize(1_000, 1)
    expect(note.store.getSnapshot()).toMatchObject({
      text: 'idea', fontSize: 32, opacity: 0.4, left: 8, top: 48, width: 720, height: 220,
    })
  })
})
