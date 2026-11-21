/** Frosted-glass controls for the full-width bottom Slot in General settings. */
import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import {
  Button,
  IconChevronDownOutlineRegular,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { ObservableSnapshot } from '@deepseek-ai/dsh-client-store'
import type { ConfigFormSnapshot } from '@deepseek-ai/dsh-client-ui-settings/client'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import {
  BOTTOM_GLASS_LIMITS,
  DEFAULT_BOTTOM_GLASS,
  normalizeBottomGlassSettings,
  type BottomGlassSettings,
} from '../settings.ts'
import type { BottomGlassMutation } from './preference.ts'
import type {} from './locales.ts'
import css from './BottomGlassRow.module.css'

/** Business face injected by the client plugin. */
export interface BottomGlassRowInjected {
  hooks: {
    appearance: ObservableSnapshot<ConfigFormSnapshot<BottomGlassSettings>>
    mutation: ObservableSnapshot<BottomGlassMutation>
  }
  setEnabled(enabled: boolean): Promise<void>
  setLiquidGlass(liquidGlass: boolean): Promise<void>
  setOpacity(opacity: number): Promise<void>
  setBlur(blur: number): Promise<void>
  setSaturation(saturation: number): Promise<void>
  reset(): Promise<void>
}

type Props = PropsRuntime<'settings.general.item'> & PropsLocale<'bottomGlass'>
  & InjectFace<BottomGlassRowInjected>

type PreviewProperties = CSSProperties & Record<`--preview-${string}`, string>

interface GlassRangeProps {
  id: string
  label: string
  hint: string
  formatValue(value: number): string
  value: number
  min: number
  max: number
  disabled: boolean
  syncToken: number
  onChange(value: number): void
}

function previewProperties(settings: BottomGlassSettings): PreviewProperties {
  return {
    '--preview-opacity': `${settings.opacity}%`,
    '--preview-blur': `${settings.blur}px`,
    '--preview-saturation': `${settings.saturation}%`,
  }
}

function GlassRange({
  id, label, hint, formatValue, value, min, max, disabled, syncToken, onChange,
}: GlassRangeProps) {
  const [draft, setDraft] = useState(value)
  const interacting = useRef(false)

  useEffect(() => {
    if (!interacting.current) setDraft(value)
  }, [syncToken, value])

  const finishInteraction = (): void => {
    interacting.current = false
  }

  return <label className={css.sliderRow} htmlFor={id}>
    <span className={css.sliderHeading}>
      <span className={css.label}>{label}</span>
      <span className={css.value}>{formatValue(draft)}</span>
    </span>
    <span className={css.hint}>{hint}</span>
    <input id={id} className={css.slider} type="range"
      min={min} max={max} step="1" value={draft} disabled={disabled}
      onPointerDown={() => { interacting.current = true }}
      onPointerUp={finishInteraction}
      onPointerCancel={finishInteraction}
      onLostPointerCapture={finishInteraction}
      onKeyDown={() => { interacting.current = true }}
      onKeyUp={finishInteraction}
      onBlur={finishInteraction}
      onChange={(event) => {
        const next = Number(event.currentTarget.value)
        setDraft(next)
        onChange(next)
      }} />
  </label>
}

/**
 * Render bottom-slot glass preferences.
 * @param props - settings snapshots, write actions, and localized copy.
 * @returns the collapsible General settings row.
 */
export function BottomGlassRow({
  useAppearance, useMutation, setEnabled, setLiquidGlass, setOpacity, setBlur, setSaturation, reset, t,
}: Props) {
  const appearance = useAppearance(value => value)
  const mutation = useMutation(value => value)
  const [expanded, setExpanded] = useState(false)
  const titleId = useId()
  const bodyId = useId()
  const opacityId = useId()
  const blurId = useId()
  const saturationId = useId()

  if (appearance.status === 'loading' && appearance.value === undefined) {
    return <div className={css.row} aria-busy="true">
      <div className={css.heading}>
        <div className={css.title}>{t('title')}</div>
        <div className={css.description}>{t('description')}</div>
      </div>
      <div className={css.previewSkeleton} />
    </div>
  }
  if (appearance.status === 'unavailable' || appearance.value === undefined) {
    return <div className={css.row}>
      <div className={css.title}>{t('title')}</div>
      <div className={css.inlineNotice} role="status">{t('unavailable')}</div>
    </div>
  }

  const settings = normalizeBottomGlassSettings(appearance.value)
  const disabled = !appearance.writable
  const isDefault = settings.enabled === DEFAULT_BOTTOM_GLASS.enabled
    && settings.liquidGlass === DEFAULT_BOTTOM_GLASS.liquidGlass
    && settings.opacity === DEFAULT_BOTTOM_GLASS.opacity
    && settings.blur === DEFAULT_BOTTOM_GLASS.blur
    && settings.saturation === DEFAULT_BOTTOM_GLASS.saturation
  const summary = settings.enabled
    ? `${t('summaryOn', { opacity: String(settings.opacity), blur: String(settings.blur) })}`
      + (settings.liquidGlass ? ` · ${t('liquidGlass')}` : '')
    : t('summaryOff')
  const notice = mutation.busy ? t('saving') : mutation.notice === 'saved' ? t('saved')
    : mutation.notice === 'failed' ? t('failed') : !appearance.writable ? t('readonly') : ''

  return <section className={css.row} aria-labelledby={titleId}>
    <button type="button" className={css.summary} aria-expanded={expanded} aria-controls={bodyId}
      onClick={() => { setExpanded(value => !value) }}>
      <span className={css.heading}>
        <span className={css.title} id={titleId}>{t('title')}</span>
        <span className={css.description}>{t('description')}</span>
      </span>
      <span className={css.summaryDetails}>
        <span className={css.summaryValue}>{summary}</span>
        <span className={css.summaryAction}>{expanded ? t('collapse') : t('expand')}</span>
      </span>
      <span className={css.summaryGlass} data-enabled={settings.enabled || undefined} aria-hidden="true">
        <span />
      </span>
      <span className={css.chevron} aria-hidden="true">
        <IconChevronDownOutlineRegular size={14} />
      </span>
    </button>

    <div className={css.expandedContent} id={bodyId} hidden={!expanded}>
      <div className={css.previewFrame} style={previewProperties(settings)}
        data-enabled={settings.enabled || undefined} data-liquid={settings.liquidGlass || undefined}
        aria-label={t('preview')}>
        <div className={css.previewContent} aria-hidden="true">
          <span className={css.previewOrb} />
          <span className={css.previewLineWide} />
          <span className={css.previewLine} />
          <span className={css.previewCard} />
          <span className={css.previewOrbAlt} />
        </div>
        <div className={css.previewGlass} aria-hidden="true">
          <span className={css.previewTitle}>{t('previewInspector')}</span>
          <span className={css.previewTabs}>
            <span>{t('previewElements')}</span>
            <span>{t('previewConsole')}</span>
          </span>
        </div>
      </div>

      <div className={css.toggleRow}>
        <span className={css.toggleText}>
          <span className={css.label}>{t('enabled')}</span>
          <span className={css.hint}>{t('enabledHint')}</span>
        </span>
        <button type="button" className={css.switch} role="switch" disabled={disabled}
          aria-checked={settings.enabled} aria-label={t('enabled')}
          onClick={() => { void setEnabled(!settings.enabled) }}>
          <span />
        </button>
      </div>

      <div className={css.toggleRow}>
        <span className={css.toggleText}>
          <span className={css.label}>{t('liquidGlass')}</span>
          <span className={css.hint}>{t('liquidGlassHint')}</span>
        </span>
        <button type="button" className={css.switch} role="switch" disabled={disabled}
          aria-checked={settings.liquidGlass} aria-label={t('liquidGlass')}
          onClick={() => { void setLiquidGlass(!settings.liquidGlass) }}>
          <span />
        </button>
      </div>

      <div className={css.sliderGroup}>
        <GlassRange
          id={opacityId}
          label={t('opacity')}
          hint={t('opacityHint')}
          formatValue={(value) => t('percent', { value: String(value) })}
          value={settings.opacity}
          min={BOTTOM_GLASS_LIMITS.opacity.min}
          max={BOTTOM_GLASS_LIMITS.opacity.max}
          disabled={disabled}
          syncToken={mutation.sequence}
          onChange={(value) => { void setOpacity(value) }}
        />
        <GlassRange
          id={blurId}
          label={t('blur')}
          hint={t('blurHint')}
          formatValue={(value) => t('pixels', { value: String(value) })}
          value={settings.blur}
          min={BOTTOM_GLASS_LIMITS.blur.min}
          max={BOTTOM_GLASS_LIMITS.blur.max}
          disabled={disabled}
          syncToken={mutation.sequence}
          onChange={(value) => { void setBlur(value) }}
        />
        <GlassRange
          id={saturationId}
          label={t('saturation')}
          hint={t('saturationHint')}
          formatValue={(value) => t('percent', { value: String(value) })}
          value={settings.saturation}
          min={BOTTOM_GLASS_LIMITS.saturation.min}
          max={BOTTOM_GLASS_LIMITS.saturation.max}
          disabled={disabled}
          syncToken={mutation.sequence}
          onChange={(value) => { void setSaturation(value) }}
        />
      </div>

      <div className={css.footer}>
        <span className={mutation.notice === 'failed' ? css.errorNotice : css.inlineNotice}
          role={mutation.notice === 'failed' ? 'alert' : 'status'} aria-live="polite">{notice}</span>
        <Button variant="ghost" size="sm" disabled={disabled || isDefault}
          onClick={() => { void reset() }}>{t('reset')}</Button>
      </div>
    </div>
  </section>
}
