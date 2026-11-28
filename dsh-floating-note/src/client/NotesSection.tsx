import { Button, IconPlusOutlineRegular, Switch } from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { MAX_NOTES, type NoteInjected } from './state.ts'

type Props = PropsRuntime<'settings.section'> & PropsLocale<'floatingNote'> & InjectFace<NoteInjected>

const FONTS = [
  ['system-ui', 'fontSystem'],
  ['Inter', 'fontInter'],
  ['Source Sans 3', 'fontSourceSans'],
  ['IBM Plex Mono', 'fontPlexMono'],
  ['serif', 'fontSerif'],
] as const

/** Render the first-level Notes settings page beside General. */
export function NotesSection({ useNote, actions, t }: Props) {
  const state = useNote(value => value)
  const atLimit = state.notes.length >= MAX_NOTES
  return (
    <div className="dsh-floating-note-settings">
      <div>
        <div className="dsh-floating-note-settings__label">{t('title')}</div>
        <p className="dsh-floating-note-settings__intro">{t('description')}</p>
      </div>
      <div className="dsh-floating-note-settings__row">
        <span className="dsh-floating-note-settings__label">{t('enabled')}</span>
        <Switch checked={state.enabled} label={t('enabled')} onChange={actions.setEnabled} />
      </div>
      <div className="dsh-floating-note-settings__row">
        <span className="dsh-floating-note-settings__label">{t('noteCount')}</span>
        <div className="dsh-floating-note-settings__control">
          <span className="dsh-floating-note-settings__value">
            {t('count', { value: String(state.notes.length), max: String(MAX_NOTES) })}
          </span>
          <Button variant="outline" size="sm" icon={<IconPlusOutlineRegular size={14} />}
            disabled={atLimit} title={atLimit ? t('limit', { max: String(MAX_NOTES) }) : t('create')}
            onClick={() => { actions.addNote() }}>
            {t('create')}
          </Button>
        </div>
      </div>
      <div className="dsh-floating-note-settings__row">
        <label className="dsh-floating-note-settings__label" htmlFor="dsh-floating-note-font-size">{t('fontSize')}</label>
        <div className="dsh-floating-note-settings__control">
          <input id="dsh-floating-note-font-size" type="range" min={12} max={32} step={1} value={state.fontSize}
            onChange={(event) => { actions.setFontSize(Number(event.target.value)) }} />
          <span className="dsh-floating-note-settings__value">{t('pixels', { value: String(state.fontSize) })}</span>
        </div>
      </div>
      <div className="dsh-floating-note-settings__row">
        <label className="dsh-floating-note-settings__label" htmlFor="dsh-floating-note-font-family">{t('fontFamily')}</label>
        <div className="dsh-floating-note-settings__control">
          <select id="dsh-floating-note-font-family" value={state.fontFamily}
            onChange={(event) => { actions.setFontFamily(event.target.value) }}>
            {FONTS.map(([value, label]) => <option key={value} value={value}>{t(label)}</option>)}
          </select>
        </div>
      </div>
      <div className="dsh-floating-note-settings__row">
        <label className="dsh-floating-note-settings__label" htmlFor="dsh-floating-note-color">{t('textColor')}</label>
        <div className="dsh-floating-note-settings__control">
          <input id="dsh-floating-note-color" type="color" value={state.color}
            onChange={(event) => { actions.setColor(event.target.value) }} />
          <span className="dsh-floating-note-settings__value">{state.color}</span>
        </div>
      </div>
      <div className="dsh-floating-note-settings__row">
        <label className="dsh-floating-note-settings__label" htmlFor="dsh-floating-note-opacity">{t('opacity')}</label>
        <div className="dsh-floating-note-settings__control">
          <input id="dsh-floating-note-opacity" type="range" min={0.4} max={1} step={0.05} value={state.opacity}
            onChange={(event) => { actions.setOpacity(Number(event.target.value)) }} />
          <span className="dsh-floating-note-settings__value">{t('percent', { value: String(Math.round(state.opacity * 100)) })}</span>
        </div>
      </div>
    </div>
  )
}
