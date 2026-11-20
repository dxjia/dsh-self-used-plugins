/** Install the current IM chat stylesheet and resolve custom background images. */
import type { ObservableSnapshot } from '@deepseek-ai/dsh-client-store'
import type { ConfigForm } from '@deepseek-ai/dsh-client-ui-settings/client'
import type { ThemeSnapshot } from '@deepseek-ai/dsh-client-ui-theme/client'
import {
  normalizeChatAppearanceSettings,
  type ChatAppearanceSettings,
} from '../settings.ts'
import { renderChatAppearanceCss } from './css.ts'
import { loadBackgroundImage } from './image-store.ts'

/**
 * Install chat appearance CSS and follow settings, themes, and local image changes.
 * @param form - Host-owned chat appearance settings form.
 * @param theme - active DSH theme source.
 * @returns disposer removing the stylesheet, subscriptions, and temporary image URL.
 */
export function installChatAppearance(
  form: ConfigForm<ChatAppearanceSettings>,
  theme: ObservableSnapshot<ThemeSnapshot>,
): () => void {
  /* v8 ignore next -- browser plugin startup always has a document. */
  if (typeof document === 'undefined') return () => {}
  const style = document.createElement('style')
  style.dataset.plugin = 'dsh-im-chat-mockup'
  style.dataset.path = 'im-chat-appearance.runtime.css'
  document.head.append(style)
  let revision = 0
  let imageId = ''
  let objectUrl: string | undefined
  let failedImageId = ''

  const releaseImage = (): void => {
    if (objectUrl !== undefined) URL.revokeObjectURL(objectUrl)
    objectUrl = undefined
    imageId = ''
  }

  const sync = async (): Promise<void> => {
    const currentRevision = ++revision
    const settings = normalizeChatAppearanceSettings(form.getSnapshot().value)
    const colorScheme = theme.getSnapshot().active.colorScheme
    let nextImageUrl: string | undefined

    if (settings.style === 'image' && settings.backgroundPreset === 'custom' && settings.customImageId !== '') {
      if (settings.customImageId !== imageId && settings.customImageId !== failedImageId) {
        try {
          const stored = await loadBackgroundImage(settings.customImageId)
          if (stored === undefined) {
            failedImageId = settings.customImageId
          } else {
            releaseImage()
            objectUrl = URL.createObjectURL(stored.blob)
            imageId = settings.customImageId
          }
        } catch (_storageError) {
          failedImageId = settings.customImageId
        }
      }
      if (settings.customImageId === imageId) nextImageUrl = objectUrl
    } else {
      releaseImage()
      failedImageId = ''
    }

    if (currentRevision !== revision) return
    style.textContent = renderChatAppearanceCss(settings, colorScheme, nextImageUrl)
    style.dataset.style = settings.style
    style.dataset.colorScheme = colorScheme
  }

  const stopForm = form.subscribe(() => { void sync() })
  const stopTheme = theme.subscribe(() => { void sync() })
  void sync()
  return () => {
    stopForm()
    stopTheme()
    ++revision
    releaseImage()
    style.remove()
  }
}
