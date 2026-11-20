/** IM-style chat appearance controls for the General settings section. */
import { useId, useRef, useState, type CSSProperties } from 'react'
import {
  Button,
  IconChevronDownOutlineRegular,
  IconChevronUpOutlineRegular,
  Input,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { ObservableSnapshot } from '@deepseek-ai/dsh-client-store'
import type { ConfigFormSnapshot } from '@deepseek-ai/dsh-client-ui-settings/client'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {
  BackgroundPreset,
  ChatAppearanceSettings,
  MessageStyle,
} from '../settings.ts'
import { normalizeChatAppearanceSettings } from '../settings.ts'
import {
  BackgroundImageError,
  deleteBackgroundImage,
  newBackgroundImageId,
  saveBackgroundImage,
} from './image-store.ts'
import type { AppearanceMutation } from './preference.ts'
import type {} from './locales.ts'
import css from './ChatAppearanceRow.module.css'

/** Business face injected by the client plugin. */
export interface ChatAppearanceRowInjected {
  hooks: {
    appearance: ObservableSnapshot<ConfigFormSnapshot<ChatAppearanceSettings>>
    mutation: ObservableSnapshot<AppearanceMutation>
  }
  setStyle(style: MessageStyle): Promise<boolean>
  setAccent(accent: string): Promise<boolean>
  setShowNames(show: boolean): Promise<boolean>
  setSenderName(name: string): Promise<boolean>
  setBackgroundPreset(preset: BackgroundPreset): Promise<boolean>
  setCustomBackground(id: string): Promise<boolean>
  reset(): Promise<boolean>
}

type Props = PropsRuntime<'settings.general.item'> & PropsLocale<'imChatAppearance'>
  & InjectFace<ChatAppearanceRowInjected>

const STYLES: readonly MessageStyle[] = ['bubble', 'solid', 'image']
const BACKGROUNDS: readonly Exclude<BackgroundPreset, 'custom'>[] = ['dusk', 'ocean', 'night']
const ACCENTS = ['#5b8cff', '#24a88d', '#df7758', '#707a89'] as const

type PreviewProperties = CSSProperties & { '--preview-background': string }

const PREVIEW_BACKGROUNDS: Record<Exclude<BackgroundPreset, 'custom'>, string> = {
  dusk: 'linear-gradient(135deg, #724b46 0%, #8d695f 42%, #425c7b 100%)',
  ocean: 'linear-gradient(145deg, #17324f 0%, #315271 48%, #867661 100%)',
  night: 'linear-gradient(140deg, #202943 0%, #405477 48%, #6f4c56 100%)',
}

/**
 * Render IM chat appearance preferences.
 * @param props - settings snapshots, write actions, and localized copy.
 * @returns the collapsible General settings row.
 */
export function ChatAppearanceRow({
  useAppearance, useMutation, setStyle, setAccent, setShowNames, setSenderName,
  setBackgroundPreset, setCustomBackground, reset, t,
}: Props) {
  const appearance = useAppearance(value => value)
  const mutation = useMutation(value => value)
  const [expanded, setExpanded] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const titleId = useId()
  const bodyId = useId()
  const fileRef = useRef<HTMLInputElement>(null)

  if (appearance.status === 'loading' && appearance.value === undefined) {
    return <div className={css.row} aria-busy="true">
      <div className={css.heading}>
        <div className={css.title}>{t('title')}</div>
        <div className={css.description}>{t('description')}</div>
      </div>
      <div className={css.skeleton} />
    </div>
  }
  if (appearance.status === 'unavailable' || appearance.value === undefined) {
    return <div className={css.row}>
      <div className={css.title}>{t('title')}</div>
      <div className={css.inlineNotice} role="status">{t('unavailable')}</div>
    </div>
  }

  const settings = normalizeChatAppearanceSettings(appearance.value)
  const busy = mutation.busy || uploading
  const disabled = busy || !appearance.writable
  const notice = uploading ? t('imageSaving') : mutation.busy ? t('saving')
    : mutation.notice === 'saved' ? t('saved') : mutation.notice === 'failed' ? t('failed')
      : !appearance.writable ? t('readonly') : ''
  const summary = t('summary', {
    style: t(settings.style),
    name: settings.senderName,
    background: t(settings.backgroundPreset),
  })

  const chooseImage = async (file: File | undefined): Promise<void> => {
    if (file === undefined || busy) return
    setUploadError('')
    setUploading(true)
    const id = newBackgroundImageId()
    let saved = false
    try {
      await saveBackgroundImage(id, file)
      saved = true
      const accepted = await setCustomBackground(id)
      if (!accepted) throw new BackgroundImageError('storage', 'settings write rejected')
      if (settings.customImageId !== '') await deleteBackgroundImage(settings.customImageId).catch(() => {})
    } catch (error) {
      if (saved) await deleteBackgroundImage(id).catch(() => {})
      setUploadError(error instanceof BackgroundImageError && error.code !== 'storage'
        ? t('imageInvalid')
        : t('imageFailed'))
    } finally {
      setUploading(false)
    }
  }

  const restoreDefaults = async (): Promise<void> => {
    const previousImage = settings.customImageId
    const accepted = await reset()
    if (accepted && previousImage !== '') await deleteBackgroundImage(previousImage).catch(() => {})
  }

  return <section className={css.row} aria-labelledby={titleId}>
    <button type="button" className={css.summary} aria-expanded={expanded} aria-controls={bodyId}
      onClick={() => { setExpanded(value => !value) }}>
      <span className={css.heading}>
        <span className={css.title} id={titleId}>{t('title')}</span>
        <span className={css.description}>{t('description')}</span>
      </span>
      <span className={css.summaryText}>{summary}</span>
      <span className={css.summaryAction}>{expanded ? t('collapse') : t('expand')}</span>
      <span className={css.summaryColor} style={{ background: settings.accent }} aria-hidden="true" />
      <span className={css.chevron} aria-hidden="true">
        {expanded ? <IconChevronUpOutlineRegular size={14} /> : <IconChevronDownOutlineRegular size={14} />}
      </span>
    </button>

    <div className={css.expanded} id={bodyId} hidden={!expanded}>
      <section className={css.section}>
        <div className={css.sectionHeader}>
          <span className={css.label}>{t('style')}</span>
          <Button variant="ghost" size="sm" disabled={disabled}
            onClick={() => { void restoreDefaults() }}>{t('reset')}</Button>
        </div>
        <div className={css.options} role="group" aria-label={t('style')}>
          {STYLES.map(style => <button key={style} type="button" className={css.option}
            aria-pressed={settings.style === style} disabled={disabled}
            onClick={() => { void setStyle(style) }}>{t(style)}</button>)}
        </div>
      </section>

      <section className={css.section}>
        <div className={css.sectionHeader}>
          <span className={css.label}>{t('accent')}</span>
          <span className={css.sectionHint}>{settings.accent}</span>
        </div>
        <div className={css.colors}>
          {ACCENTS.map(accent => <button key={accent} type="button" className={css.swatch}
            style={{ '--swatch': accent } as CSSProperties}
            data-selected={settings.accent.toLowerCase() === accent || undefined}
            aria-label={accent} aria-pressed={settings.accent.toLowerCase() === accent}
            disabled={disabled} onClick={() => { void setAccent(accent) }} />)}
          <label className={css.colorPicker} title={t('customColor')}>
            <input type="color" value={settings.accent} aria-label={t('customColor')} disabled={disabled}
              onChange={(event) => { void setAccent(event.currentTarget.value) }} />
          </label>
        </div>
      </section>

      <section className={css.section} hidden={settings.style !== 'image'}>
        <div className={css.sectionHeader}>
          <span className={css.label}>{t('background')}</span>
          <span className={css.sectionHint}>{t('imageHint')}</span>
        </div>
        <div className={css.backgroundGrid} role="group" aria-label={t('background')}>
          {BACKGROUNDS.map(preset => <button key={preset} type="button" className={css.background}
            style={{ '--preview-background': PREVIEW_BACKGROUNDS[preset] } as PreviewProperties}
            aria-pressed={settings.backgroundPreset === preset} disabled={disabled}
            onClick={() => { void setBackgroundPreset(preset) }}>
            <span>{t(preset)}</span>
          </button>)}
        </div>
        <input ref={fileRef} hidden type="file" accept="image/png,image/jpeg,image/webp"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0]
            event.currentTarget.value = ''
            void chooseImage(file)
          }} />
        <Button variant="ghost" size="sm" disabled={disabled}
          onClick={() => { fileRef.current?.click() }}>
          {settings.backgroundPreset === 'custom' ? t('replaceImage') : t('uploadImage')}
        </Button>
      </section>

      <div className={css.toggleRow}>
        <span>
          <span className={css.label}>{t('showNames')}</span>
          <span className={css.toggleHint}>{t('showNamesHint')}</span>
        </span>
        <button type="button" className={css.switch} role="switch" disabled={disabled}
          aria-checked={settings.showNames} aria-label={t('showNames')}
          onClick={() => { void setShowNames(!settings.showNames) }}>
          <span />
        </button>
      </div>

      <div className={css.fields}>
        <label className={css.field}>
          <span>{t('senderName')}</span>
          <Input key={settings.senderName} defaultValue={settings.senderName} maxLength={40}
            placeholder={t('senderPlaceholder')} disabled={disabled}
            onBlur={(event) => {
              const value = event.currentTarget.value.trim()
              if (value !== '' && value !== settings.senderName) void setSenderName(value)
            }}
            onKeyDown={(event) => {
              // oxlint-disable-next-line typescript/no-deprecated -- Some IMEs report composition only through keyCode 229.
              if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return
              if (event.key === 'Enter') event.currentTarget.blur()
            }} />
        </label>
        <div className={css.modelField}>
          <span>{t('assistantName')}</span>
          <div className={css.modelValue}>{t('assistantHint')}</div>
        </div>
      </div>

      <div className={css.footer} aria-live="polite">
        <span className={uploadError === '' ? css.inlineNotice : css.errorNotice}>{uploadError || notice}</span>
      </div>
    </div>
  </section>
}
