/** Non-visual Chat-node decorator preserving the native Chat renderer. */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ChatConversationViewNode, ChatNode, ChatSnapshot } from '@deepseek-ai/dsh-client-ui-chat/client'
import type { ModelDirectoryState } from '@deepseek-ai/dsh-client-ui-model-selection/client'
import type { ObservableSnapshot } from '@deepseek-ai/dsh-client-store'
import type { ConfigFormSnapshot } from '@deepseek-ai/dsh-client-ui-settings/client'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import {
  normalizeChatAppearanceSettings,
  type ChatAppearanceSettings,
} from '../settings.ts'
import {
  FOLD_READY_ATTRIBUTE,
  FOLD_STATE_ATTRIBUTE,
  FOLD_TOGGLE_ATTRIBUTE,
  OUTBOUND_ROW_SELECTOR,
  foldRows,
  forgetFold,
  syncFoldToggles,
  toggleFold,
} from './fold-dom.ts'
import type {} from './locales.ts'
import { formatLastUpdated, messageMeta, resolveModelDisplayName } from './time.ts'

interface DecoratorInjected {
  hooks: {
    appearance: ObservableSnapshot<ConfigFormSnapshot<ChatAppearanceSettings>>
    modelDirectory: ObservableSnapshot<ModelDirectoryState>
  }
}

type Props = PropsRuntime<'conversation.session.header.actions'>
  & PropsLocale<'imChatAppearance'>
  & InjectFace<DecoratorInjected>

const RELEVANT_KINDS = new Set(['user', 'steering', 'assistant-step'])

function typedNode(node: ChatConversationViewNode | undefined): ChatNode | undefined {
  return node as ChatNode | undefined
}

function visibleChatRoot(): HTMLElement | undefined {
  return [...document.querySelectorAll<HTMLElement>('[data-chat-flow]')]
    .find(root => root.closest('[hidden]') === null && root.getClientRects().length > 0)
}

function metaOf(
  node: ChatNode,
  senderName: string,
  assistantName: string,
  showNames: boolean,
  now: number,
): string | undefined {
  if (node.kind === 'user' || node.kind === 'steering') {
    return messageMeta(senderName, formatLastUpdated(node.data.time), showNames)
  }
  if (node.kind === 'assistant-step') {
    const time = node.data.status === 'running' ? now : node.data.time
    return messageMeta(assistantName, formatLastUpdated(time), showNames)
  }
  return undefined
}

function clearDecorations(): void {
  for (const element of document.querySelectorAll<HTMLElement>('[data-chat-flow]')) {
    element.removeAttribute('data-dsh-im-enabled')
  }
  for (const element of document.querySelectorAll<HTMLElement>('[data-dsh-im-meta], [data-dsh-im-assistant-surface]')) {
    element.removeAttribute('data-dsh-im-meta')
    element.removeAttribute('data-dsh-im-assistant-surface')
  }
  for (const element of document.querySelectorAll<HTMLElement>(`[${FOLD_READY_ATTRIBUTE}], [${FOLD_STATE_ATTRIBUTE}]`)) {
    element.removeAttribute(FOLD_READY_ATTRIBUTE)
    element.removeAttribute(FOLD_STATE_ATTRIBUTE)
  }
  for (const button of document.querySelectorAll<HTMLElement>(`[${FOLD_TOGGLE_ATTRIBUTE}]`)) button.remove()
}

function setAttributeIfChanged(element: HTMLElement, name: string, value: string): void {
  if (element.getAttribute(name) !== value) element.setAttribute(name, value)
}

function removeAttributeIfPresent(element: HTMLElement, name: string): void {
  if (element.hasAttribute(name)) element.removeAttribute(name)
}

function containsChatStructure(node: Node): boolean {
  if (!(node instanceof Element)) return false
  return node.matches('[data-chat-flow], [data-chat-node-key], [data-submission-echo], [data-pending-steering]')
    || node.querySelector('[data-chat-flow], [data-chat-node-key], [data-submission-echo], [data-pending-steering]') !== null
}

/**
 * Decorate visible user and assistant rows without replacing DSH rendering.
 * @param props - Chat store, appearance settings, current model, and localized copy.
 * @returns no visible DOM of its own.
 */
export function ChatAppearanceDecorator({
  useChat, useAppearance, useModelDirectory, t,
}: Props) {
  const nodes = useChat((snapshot: ChatSnapshot) => snapshot.nodes)
  const signature = useChat((snapshot: ChatSnapshot) => snapshot.order.map((key) => {
    const node = typedNode(snapshot.nodes.get(key))
    return node === undefined || !RELEVANT_KINDS.has(node.kind)
      ? ''
      : `${key}:${node.kind}:${node.kind === 'assistant-step' ? node.data.status : ''}:${node.kind === 'assistant-step' || node.kind === 'user' || node.kind === 'steering' ? node.data.time : ''}`
  }).join('|'))
  const hasRunning = useChat((snapshot: ChatSnapshot) => snapshot.order.some((key) => {
    const node = typedNode(snapshot.nodes.get(key))
    return node?.kind === 'assistant-step' && node.data.status === 'running'
  }))
  const appearance = useAppearance(value => value)
  const model = useModelDirectory(value => value)
  const settings = normalizeChatAppearanceSettings(appearance.value)
  const assistantName = resolveModelDisplayName(model, t('assistantFallback'))
  const foldMore = t('foldMore')
  const foldLess = t('foldLess')
  const [now, setNow] = useState(() => Date.now())
  const decorateRef = useRef<() => void>(() => {})
  const latest = useRef({ assistantName, nodes, now, settings, foldMore, foldLess })
  latest.current = { assistantName, nodes, now, settings, foldMore, foldLess }

  useEffect(() => {
    if (!hasRunning) return
    setNow(Date.now())
    const timer = window.setInterval(() => { setNow(Date.now()) }, 30_000)
    return () => { window.clearInterval(timer) }
  }, [hasRunning])

  useLayoutEffect(() => {
    let frame: number | undefined
    let resizeFrame: number | undefined
    const expandedKeys = new Set<string>()
    const decorate = (): void => {
      frame = undefined
      const root = visibleChatRoot()
      if (root === undefined) {
        clearDecorations()
        return
      }
      setAttributeIfChanged(root, 'data-dsh-im-enabled', '')
      const current = latest.current
      for (const wrapper of root.querySelectorAll<HTMLElement>('[data-chat-node-key][data-chat-flow-kind]')) {
        const key = wrapper.dataset.chatNodeKey
        const kind = wrapper.dataset.chatFlowKind
        const node = key === undefined ? undefined : typedNode(current.nodes.get(key))
        const groupPart = wrapper.getAttribute('data-chat-group-part')
        const assistantResponse = kind === 'assistant-step'
          && node?.kind === 'assistant-step'
          && (groupPart === null || groupPart === 'response')
        const meta = node === undefined || (kind === 'assistant-step' && !assistantResponse)
          ? undefined
          : metaOf(node, current.settings.senderName, current.assistantName, current.settings.showNames, current.now)
        if (meta === undefined) removeAttributeIfPresent(wrapper, 'data-dsh-im-meta')
        else setAttributeIfChanged(wrapper, 'data-dsh-im-meta', meta)

        const slot = wrapper.querySelector<HTMLElement>(':scope > [data-slot="conversation.chat.node"]')
        const surface = slot?.firstElementChild
        if (surface instanceof HTMLElement && assistantResponse) {
          setAttributeIfChanged(surface, 'data-dsh-im-assistant-surface', '')
        } else if (surface instanceof HTMLElement) {
          removeAttributeIfPresent(surface, 'data-dsh-im-assistant-surface')
        }
      }

      const pendingMeta = messageMeta(current.settings.senderName, formatLastUpdated(Date.now()), current.settings.showNames)
      for (const row of root.querySelectorAll<HTMLElement>('[data-submission-echo], [data-pending-steering]')) {
        setAttributeIfChanged(row, 'data-dsh-im-meta', pendingMeta)
      }

      foldRows(root, current.settings, expandedKeys)
      syncFoldToggles(root, { more: current.foldMore, less: current.foldLess })
    }
    decorateRef.current = decorate
    const schedule = (): void => {
      if (frame !== undefined) return
      frame = window.requestAnimationFrame(() => {
        decorate()
      })
    }
    const observer = new MutationObserver((mutations) => {
      const structural = mutations.some((mutation) => {
        if (mutation.type === 'attributes') return true
        if ([...mutation.addedNodes].some(containsChatStructure)) return true
        const target = mutation.target instanceof Element ? mutation.target : mutation.target.parentElement
        return target?.matches('[data-slot="conversation.chat.node"]') === true
          && [...mutation.addedNodes].some(node => node instanceof Element)
      })
      if (structural) schedule()
    })
    if (document.body !== null) observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-chat-flow-kind', 'data-chat-node-key', 'data-chat-group-part'],
    })
    // Line wrapping depends on the column width and the loaded font, so both
    // invalidate earlier measurements instead of keeping a stale control.
    const remeasure = (): void => {
      const root = visibleChatRoot()
      if (root === undefined) return
      for (const row of root.querySelectorAll<HTMLElement>(OUTBOUND_ROW_SELECTOR)) {
        forgetFold(row)
      }
      schedule()
    }
    const onResize = (): void => {
      if (resizeFrame !== undefined) window.cancelAnimationFrame(resizeFrame)
      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = undefined
        remeasure()
      })
    }
    // The plugin owns the button, so one delegated listener outlives row rebuilds.
    const onClick = (event: MouseEvent): void => {
      const target = event.target
      if (!(target instanceof Element)) return
      const button = target.closest<HTMLElement>(`[${FOLD_TOGGLE_ATTRIBUTE}]`)
      if (button === null) return
      const row = button.closest<HTMLElement>(OUTBOUND_ROW_SELECTOR)
      if (row === null) return
      event.preventDefault()
      event.stopPropagation()
      toggleFold(row, expandedKeys)
      const chatRoot = button.closest<HTMLElement>('[data-chat-flow]')
      if (chatRoot !== null) {
        syncFoldToggles(chatRoot, { more: latest.current.foldMore, less: latest.current.foldLess })
      }
    }
    document.addEventListener('click', onClick)
    window.addEventListener('resize', onResize)
    if (typeof document.fonts !== 'undefined') void document.fonts.ready.then(remeasure, () => {})
    decorate()
    return () => {
      observer.disconnect()
      document.removeEventListener('click', onClick)
      window.removeEventListener('resize', onResize)
      if (frame !== undefined) window.cancelAnimationFrame(frame)
      if (resizeFrame !== undefined) window.cancelAnimationFrame(resizeFrame)
      decorateRef.current = () => {}
      clearDecorations()
    }
  }, [])

  useLayoutEffect(() => {
    decorateRef.current()
  }, [assistantName, now, settings.showNames, settings.senderName, settings.collapseLong, foldMore, foldLess, signature])

  return null
}
