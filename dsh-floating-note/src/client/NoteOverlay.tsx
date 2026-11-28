import { useCallback, useEffect, useRef, type CSSProperties, type PointerEvent } from 'react'
import { IconCloseOutlineRegular, IconPlusOutlineRegular } from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { MAX_NOTES, noteNumber, type NoteActions, type NoteInjected, type NoteState, type NoteWindow } from './state.ts'

type Props = PropsRuntime<'shell.overlay'> & PropsLocale<'floatingNote'> & InjectFace<NoteInjected>
type Appearance = Pick<NoteState, 'fontSize' | 'fontFamily' | 'color' | 'opacity'>
type NoteStyle = CSSProperties & Record<'--dsh-floating-note-color' | '--dsh-floating-note-font-family' | '--dsh-floating-note-font-size', string>

interface WindowProps {
  note: NoteWindow
  appearance: Appearance
  actions: NoteActions
  t: Props['t']
  atLimit: boolean
}

/** Render every open note over the dsh content frame. */
export function NoteOverlay({ useNote, actions, t }: Props) {
  const state = useNote(value => value)
  if (!state.enabled) return null
  const atLimit = state.notes.length >= MAX_NOTES
  return (
    <>
      {state.notes.map(note => (
        <NoteWindowView key={note.id} note={note} appearance={state} actions={actions} t={t} atLimit={atLimit} />
      ))}
    </>
  )
}

/** One draggable, resizable note window with its own editor. */
function NoteWindowView({ note, appearance, actions, t, atLimit }: WindowProps) {
  const noteRef = useRef<HTMLDivElement | null>(null)
  const drag = useRef<{ x: number; y: number; left: number; top: number } | undefined>(undefined)
  const onPointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest('button') !== null) return
    actions.raiseNote(note.id)
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { x: event.clientX, y: event.clientY, left: note.left, top: note.top }
  }, [actions, note.id, note.left, note.top])
  const onPointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const origin = drag.current
    if (origin === undefined) return
    actions.moveNote(note.id, origin.left + event.clientX - origin.x, origin.top + event.clientY - origin.y)
  }, [actions, note.id])
  const endDrag = useCallback(() => { drag.current = undefined }, [])
  useEffect(() => {
    const element = noteRef.current
    if (element === null || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      const bounds = element.getBoundingClientRect()
      actions.resizeNote(note.id, bounds.width, bounds.height)
    })
    observer.observe(element)
    return () => { observer.disconnect() }
  }, [actions, note.id])

  const title = t('noteTitle', { index: String(noteNumber(note.id)) })
  const style: NoteStyle = {
    left: note.left,
    top: note.top,
    width: note.width,
    height: note.height,
    opacity: appearance.opacity,
    '--dsh-floating-note-color': appearance.color,
    '--dsh-floating-note-font-family': appearance.fontFamily,
    '--dsh-floating-note-font-size': `${appearance.fontSize}px`,
  }
  return (
    <div ref={noteRef} className="dsh-floating-note" style={style}>
      <div className="dsh-floating-note__header" title={t('drag')} onPointerDown={onPointerDown}
        onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag}>
        <span className="dsh-floating-note__title">{title}</span>
        <span className="dsh-floating-note__actions">
          <button type="button" className="dsh-floating-note__action" aria-label={t('create')}
            title={atLimit ? t('limit', { max: String(MAX_NOTES) }) : t('create')}
            disabled={atLimit} onClick={() => { actions.addNote() }}>
            <IconPlusOutlineRegular size={14} />
          </button>
          <button type="button" className="dsh-floating-note__action" aria-label={t('close')} title={t('close')}
            onClick={() => { closeNote(note, title, actions, t) }}>
            <IconCloseOutlineRegular size={14} />
          </button>
        </span>
      </div>
      <textarea className="dsh-floating-note__editor" value={note.text} placeholder={t('placeholder')}
        aria-label={title} onFocus={() => { actions.raiseNote(note.id) }}
        onChange={(event) => { actions.setText(note.id, event.target.value) }} />
    </div>
  )
}

/** Drop one note, confirming first so typed text never disappears silently. */
function closeNote(note: NoteWindow, title: string, actions: NoteActions, t: Props['t']): void {
  if (note.text.trim() !== '' && typeof window !== 'undefined') {
    if (!window.confirm(t('discard', { name: title }))) return
  }
  actions.removeNote(note.id)
}
