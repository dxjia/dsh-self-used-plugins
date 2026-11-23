import { useCallback, useEffect, useRef, type CSSProperties, type PointerEvent } from 'react'
import { IconCloseOutlineRegular } from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { NoteInjected } from './state.ts'

type Props = PropsRuntime<'shell.overlay'> & PropsLocale<'floatingNote'> & InjectFace<NoteInjected>
type NoteStyle = CSSProperties & Record<'--dsh-floating-note-color' | '--dsh-floating-note-font-family' | '--dsh-floating-note-font-size', string>

/** Render the editable note over the dsh content frame. */
export function NoteOverlay({ useNote, actions, t }: Props) {
  const state = useNote(value => value)
  const noteRef = useRef<HTMLDivElement | null>(null)
  const drag = useRef<{ x: number; y: number; left: number; top: number } | undefined>(undefined)
  const onPointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest('button') !== null) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { x: event.clientX, y: event.clientY, left: state.left, top: state.top }
  }, [state.left, state.top])
  const onPointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const origin = drag.current
    if (origin === undefined) return
    actions.setPosition(origin.left + event.clientX - origin.x, origin.top + event.clientY - origin.y)
  }, [actions])
  const endDrag = useCallback(() => { drag.current = undefined }, [])
  useEffect(() => {
    const element = noteRef.current
    if (element === null || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      const bounds = element.getBoundingClientRect()
      actions.setSize(bounds.width, bounds.height)
    })
    observer.observe(element)
    return () => { observer.disconnect() }
  }, [actions])

  if (!state.enabled) return null
  const style: NoteStyle = {
    left: state.left,
    top: state.top,
    width: state.width,
    height: state.height,
    opacity: state.opacity,
    '--dsh-floating-note-color': state.color,
    '--dsh-floating-note-font-family': state.fontFamily,
    '--dsh-floating-note-font-size': `${state.fontSize}px`,
  }
  return (
    <div ref={noteRef} className="dsh-floating-note" style={style}>
      <div className="dsh-floating-note__header" title={t('drag')} onPointerDown={onPointerDown}
        onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag}>
        <span className="dsh-floating-note__title">{t('title')}</span>
        <button type="button" className="dsh-floating-note__hide" aria-label={t('hide')}
          onClick={() => { actions.setEnabled(false) }}>
          <IconCloseOutlineRegular size={14} />
        </button>
      </div>
      <textarea className="dsh-floating-note__editor" value={state.text} placeholder={t('placeholder')}
        aria-label={t('title')} onChange={(event) => { actions.setText(event.target.value) }} />
    </div>
  )
}
