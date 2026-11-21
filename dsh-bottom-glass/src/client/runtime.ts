/** Install the full-width bottom-slot frosted-glass stylesheet. */
import type { ConfigForm } from '@deepseek-ai/dsh-client-ui-settings/client'
import {
  DEFAULT_BOTTOM_GLASS,
  normalizeBottomGlassSettings,
  type BottomGlassSettings,
} from '../settings.ts'

const INSPECTOR_IFRAME_SELECTOR = 'iframe[data-inspector-devtools]'
const INSPECTOR_STYLE_ID = 'dsh-bottom-glass-inspector'

/** CSS injected into the same-origin Inspector document. */
export const INSPECTOR_GLASS_CSS = `
:root {
  --sys-color-base: transparent !important;
  --sys-color-base-container: transparent !important;
  --sys-color-cdt-base: transparent !important;
  --sys-color-cdt-base-container: transparent !important;
}

html,
body,
#-blink-dev-tools {
  background: transparent !important;
}

@media (forced-colors: active) {
  :root {
    --sys-color-base: Canvas !important;
    --sys-color-base-container: Canvas !important;
    --sys-color-cdt-base: Canvas !important;
    --sys-color-cdt-base-container: Canvas !important;
  }

  html,
  body,
  #-blink-dev-tools {
    background: Canvas !important;
  }
}
`

/**
 * Render CSS for one complete bottom-glass preference.
 * @param settings - normalized glass settings.
 * @returns scoped CSS applied only while the plugin is active and enabled.
 */
export function renderBottomGlassCss(settings: BottomGlassSettings): string {
  const liquidGlass = settings.liquidGlass
    ? `
@media (prefers-reduced-transparency: no-preference) and (forced-colors: none) {
  body[data-dsh-bottom-glass] [data-composer-card],
  body[data-dsh-bottom-glass] [data-composer-card] button:not(
    [data-slot='conversation.input.permission'] *,
    [data-slot='conversation.input.model'] *
  ),
  body[data-dsh-bottom-glass] [data-composer-card] [role='button']:not(
    [data-slot='conversation.input.permission'] *,
    [data-slot='conversation.input.model'] *
  ) {
    background-image:
      linear-gradient(
        132deg,
        rgb(255 255 255 / 0.34) 0,
        rgb(255 255 255 / 0.1) 18%,
        transparent 38%
      ),
      linear-gradient(
        318deg,
        rgb(255 255 255 / 0.1) 0,
        transparent 30%
      );
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 0.42),
      inset 0 0 0 0.5px rgb(255 255 255 / 0.16),
      0 10px 28px rgb(0 0 0 / 0.12);
    -webkit-backdrop-filter: blur(${settings.blur}px) saturate(${settings.saturation}%) contrast(1.04) brightness(1.02);
    backdrop-filter: blur(${settings.blur}px) saturate(${settings.saturation}%) contrast(1.04) brightness(1.02);
  }
}
`
    : ''
  return `
body[data-dsh-bottom-glass] [data-shell-bottom] {
  background-color: color-mix(
    in srgb,
    var(--dsw-alias-bg-base) ${settings.opacity}%,
    transparent
  );
  -webkit-backdrop-filter: blur(${settings.blur}px) saturate(${settings.saturation}%);
  backdrop-filter: blur(${settings.blur}px) saturate(${settings.saturation}%);
}

body[data-dsh-bottom-glass] div:has(> [data-slot="sidebar"]) {
  background-color: color-mix(
    in srgb,
    var(--dsw-specific-sidebar-fill) ${settings.opacity}%,
    transparent
  );
  -webkit-backdrop-filter: blur(${settings.blur}px) saturate(${settings.saturation}%);
  backdrop-filter: blur(${settings.blur}px) saturate(${settings.saturation}%);
}

body[data-dsh-bottom-glass] [data-slot="sidebar"] > div {
  background-color: transparent;
}

body[data-dsh-bottom-glass] div:has(> div > [data-slot="main"]) {
  background-color: transparent;
}

body[data-dsh-bottom-glass] div:has(> [data-conversation-content]) {
  background-color: color-mix(
    in srgb,
    var(--dsw-alias-bg-base) ${settings.opacity}%,
    transparent
  );
  -webkit-backdrop-filter: blur(${settings.blur}px) saturate(${settings.saturation}%);
  backdrop-filter: blur(${settings.blur}px) saturate(${settings.saturation}%);
}

body[data-dsh-bottom-glass] div:has(> [data-slot="rightbar"]) {
  background-color: color-mix(
    in srgb,
    var(--dsw-alias-bg-base) ${settings.opacity}%,
    transparent
  );
  -webkit-backdrop-filter: blur(${settings.blur}px) saturate(${settings.saturation}%);
  backdrop-filter: blur(${settings.blur}px) saturate(${settings.saturation}%);
}

body[data-dsh-bottom-glass] [data-sidebar-right-panel] [data-dockkit-host='dock'] > [data-dockkit-pane] {
  background-color: transparent;
}

body[data-dsh-bottom-glass] [data-sidebar-right-panel] [data-dockkit-empty] {
  background-color: transparent;
}

body[data-dsh-bottom-glass] [data-sidebar-right-panel] [data-sidebar-terminal],
body[data-dsh-bottom-glass] [data-sidebar-right-panel] [data-sidebar-terminal] > div {
  background-color: transparent;
}

body[data-dsh-bottom-glass] [data-sidebar-right-panel] [data-sidebar-terminal] .xterm,
body[data-dsh-bottom-glass] [data-sidebar-right-panel] [data-sidebar-terminal] .xterm-viewport,
body[data-dsh-bottom-glass] [data-sidebar-right-panel] [data-sidebar-terminal] .xterm-screen {
  background-color: transparent !important;
}

body[data-dsh-bottom-glass] [data-sidebar-right-panel] [data-files-navigator] {
  background-color: transparent;
}

body[data-dsh-bottom-glass] [data-sidebar-right-panel] [data-files-search-settings] {
  background-color: color-mix(
    in srgb,
    var(--dsw-alias-bg-base) ${settings.opacity}%,
    transparent
  );
  -webkit-backdrop-filter: blur(${settings.blur}px) saturate(${settings.saturation}%);
  backdrop-filter: blur(${settings.blur}px) saturate(${settings.saturation}%);
}

body[data-dsh-bottom-glass] [data-conversation-content] [data-composer-seat] {
  background: none;
}

body[data-dsh-bottom-glass] [data-composer-card] {
  background-color: color-mix(
    in srgb,
    var(--dsw-specific-input-major) ${settings.opacity}%,
    transparent
  );
  -webkit-backdrop-filter: blur(${settings.blur}px) saturate(${settings.saturation}%);
  backdrop-filter: blur(${settings.blur}px) saturate(${settings.saturation}%);
}

body[data-dsh-bottom-glass] [data-composer-dock] {
  box-sizing: border-box;
  width: calc(100% - 4 * var(--dsh-composer-dock-inset));
  max-width: calc(
    var(--dsh-composer-card-max-width) -
    4 * var(--dsh-composer-dock-inset)
  );
  margin: var(--dsh-composer-stack-gap) auto 0;
  padding: 3px 8px;
  border-radius: var(--dsw-radius-md);
  background-color: color-mix(
    in srgb,
    color-mix(
      in srgb,
      var(--dsw-alias-label-primary) 4%,
      var(--dsw-alias-bg-base)
    ) calc(${settings.opacity}% + 10%),
    transparent
  );
  background-image: linear-gradient(
    180deg,
    color-mix(in srgb, var(--dsw-alias-label-primary) 4%, transparent),
    transparent 48%
  );
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary) 7%, transparent),
    inset 0 0 0 0.5px var(--dsw-alias-border-l2),
    0 4px 12px color-mix(in srgb, var(--dsw-alias-bg-mask-1) 18%, transparent);
  -webkit-backdrop-filter: blur(${settings.blur}px) saturate(${settings.saturation}%);
  backdrop-filter: blur(${settings.blur}px) saturate(${settings.saturation}%);
}

body[data-dsh-bottom-glass] [data-goal-bar] > div::before {
  background-color: color-mix(
    in srgb,
    color-mix(
      in srgb,
      var(--dsw-alias-label-primary) 4%,
      var(--dsw-alias-bg-base)
    ) calc(${settings.opacity}% + 10%),
    transparent
  );
  background-image: linear-gradient(
    180deg,
    color-mix(in srgb, var(--dsw-alias-label-primary) 4%, transparent),
    transparent 48%
  );
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary) 7%, transparent),
    inset 0 0 0 0.5px var(--dsw-alias-border-l2),
    0 4px 12px color-mix(in srgb, var(--dsw-alias-bg-mask-1) 18%, transparent);
  -webkit-backdrop-filter: blur(${settings.blur}px) saturate(${settings.saturation}%);
  backdrop-filter: blur(${settings.blur}px) saturate(${settings.saturation}%);
}

body[data-dsh-bottom-glass] [data-queue-dock] > div::before,
body[data-dsh-bottom-glass] [data-testid='todo-panel'] {
  background: color-mix(
    in srgb,
    var(--dsw-alias-bg-base) ${settings.opacity}%,
    transparent
  );
  -webkit-backdrop-filter: blur(${settings.blur}px) saturate(${settings.saturation}%);
  backdrop-filter: blur(${settings.blur}px) saturate(${settings.saturation}%);
}

${liquidGlass}

body[data-dsh-bottom-glass] [data-shell-bottom] :where([data-inspector-panel]) {
  background-color: transparent;
}

@media (prefers-reduced-transparency: reduce) {
  body[data-dsh-bottom-glass] [data-shell-bottom],
  body[data-dsh-bottom-glass] div:has(> [data-slot="sidebar"]),
  body[data-dsh-bottom-glass] div:has(> [data-conversation-content]),
  body[data-dsh-bottom-glass] div:has(> [data-slot="rightbar"]) {
    background-color: var(--dsw-alias-bg-base);
  }

  body[data-dsh-bottom-glass] [data-conversation-content] [data-composer-seat] {
    background: none;
  }

  body[data-dsh-bottom-glass] [data-composer-card] {
    background-color: var(--dsw-specific-input-major);
  }

  body[data-dsh-bottom-glass] [data-composer-dock],
  body[data-dsh-bottom-glass] [data-queue-dock] > div::before,
  body[data-dsh-bottom-glass] [data-testid='todo-panel'] {
    background: var(--dsw-alias-bg-base);
  }

  body[data-dsh-bottom-glass] [data-goal-bar] > div::before {
    background: var(--dsw-alias-bg-base);
    box-shadow: none;
  }

  body[data-dsh-bottom-glass] [data-composer-dock] {
    background-image: none;
    box-shadow: none;
  }

  body[data-dsh-bottom-glass] [data-sidebar-right-panel] [data-sidebar-terminal],
  body[data-dsh-bottom-glass] [data-sidebar-right-panel] [data-sidebar-terminal] > div,
  body[data-dsh-bottom-glass] [data-sidebar-right-panel] [data-files-navigator],
  body[data-dsh-bottom-glass] [data-sidebar-right-panel] [data-files-search-settings] {
    background-color: var(--dsw-alias-bg-base);
  }

  body[data-dsh-bottom-glass] [data-shell-bottom],
  body[data-dsh-bottom-glass] div:has(> [data-slot="sidebar"]),
  body[data-dsh-bottom-glass] div:has(> [data-conversation-content]),
  body[data-dsh-bottom-glass] div:has(> [data-slot="rightbar"]),
  body[data-dsh-bottom-glass] [data-composer-card],
  body[data-dsh-bottom-glass] [data-composer-dock],
  body[data-dsh-bottom-glass] [data-goal-bar] > div::before,
  body[data-dsh-bottom-glass] [data-queue-dock] > div::before,
  body[data-dsh-bottom-glass] [data-testid='todo-panel'] {
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}

@media (forced-colors: active) {
  body[data-dsh-bottom-glass] [data-shell-bottom],
  body[data-dsh-bottom-glass] div:has(> [data-slot="sidebar"]),
  body[data-dsh-bottom-glass] div:has(> [data-conversation-content]),
  body[data-dsh-bottom-glass] div:has(> [data-slot="rightbar"]),
  body[data-dsh-bottom-glass] [data-conversation-content] [data-composer-seat] {
    background: none;
  }

  body[data-dsh-bottom-glass] [data-composer-card] {
    background-color: Canvas;
  }

  body[data-dsh-bottom-glass] [data-composer-dock],
  body[data-dsh-bottom-glass] [data-queue-dock] > div::before,
  body[data-dsh-bottom-glass] [data-testid='todo-panel'] {
    background: Canvas;
  }

  body[data-dsh-bottom-glass] [data-goal-bar] > div::before {
    background: Canvas;
    box-shadow: none;
  }

  body[data-dsh-bottom-glass] [data-composer-dock] {
    background-image: none;
    box-shadow: none;
  }

  body[data-dsh-bottom-glass] [data-sidebar-right-panel] [data-sidebar-terminal],
  body[data-dsh-bottom-glass] [data-sidebar-right-panel] [data-sidebar-terminal] > div,
  body[data-dsh-bottom-glass] [data-sidebar-right-panel] [data-files-navigator],
  body[data-dsh-bottom-glass] [data-sidebar-right-panel] [data-files-search-settings] {
    background-color: Canvas;
  }

  body[data-dsh-bottom-glass] [data-shell-bottom],
  body[data-dsh-bottom-glass] div:has(> [data-slot="sidebar"]),
  body[data-dsh-bottom-glass] div:has(> [data-conversation-content]),
  body[data-dsh-bottom-glass] div:has(> [data-slot="rightbar"]),
  body[data-dsh-bottom-glass] [data-composer-card],
  body[data-dsh-bottom-glass] [data-composer-dock],
  body[data-dsh-bottom-glass] [data-goal-bar] > div::before,
  body[data-dsh-bottom-glass] [data-queue-dock] > div::before,
  body[data-dsh-bottom-glass] [data-testid='todo-panel'] {
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}
`
}

function syncInspector(frame: HTMLIFrameElement, enabled: boolean): void {
  const inspectorDocument = frame.contentDocument
  if (inspectorDocument === null) return
  const existing = inspectorDocument.getElementById(INSPECTOR_STYLE_ID)
  if (!enabled) {
    existing?.remove()
    return
  }
  if (existing !== null) {
    if (existing.textContent !== INSPECTOR_GLASS_CSS) existing.textContent = INSPECTOR_GLASS_CSS
    return
  }
  const style = inspectorDocument.createElement('style')
  style.id = INSPECTOR_STYLE_ID
  style.textContent = INSPECTOR_GLASS_CSS
  inspectorDocument.head.append(style)
}

/**
 * Follow bottom-glass settings until the plugin or its Host namespace unloads.
 * @param form - Host-owned bottom-glass settings form.
 * @returns disposer removing the stylesheet, body marker, and subscription.
 */
export function installBottomGlass(form: ConfigForm<BottomGlassSettings>): () => void {
  /* v8 ignore next -- browser plugin startup always has a document. */
  if (typeof document === 'undefined') return () => {}
  const style = document.createElement('style')
  style.dataset.plugin = 'dsh-bottom-glass'
  style.dataset.path = 'bottom-glass.runtime.css'
  document.head.append(style)

  let enabled = DEFAULT_BOTTOM_GLASS.enabled
  const syncInspectors = (): void => {
    for (const frame of document.querySelectorAll<HTMLIFrameElement>(INSPECTOR_IFRAME_SELECTOR)) {
      syncInspector(frame, enabled)
    }
  }
  const onLoad = (event: Event): void => {
    if (event.target instanceof HTMLIFrameElement && event.target.matches(INSPECTOR_IFRAME_SELECTOR)) {
      syncInspector(event.target, enabled)
    }
  }
  const sync = (): void => {
    const settings = normalizeBottomGlassSettings(form.getSnapshot().value)
    enabled = settings.enabled
    style.textContent = settings.enabled ? renderBottomGlassCss(settings) : ''
    style.dataset.enabled = String(settings.enabled)
    if (settings.enabled) document.body.dataset.dshBottomGlass = ''
    else delete document.body.dataset.dshBottomGlass
    syncInspectors()
  }

  document.addEventListener('load', onLoad, true)
  const stop = form.subscribe(sync)
  sync()
  return () => {
    stop()
    document.removeEventListener('load', onLoad, true)
    enabled = false
    syncInspectors()
    delete document.body.dataset.dshBottomGlass
    style.remove()
  }
}

/** Browser startup values used before the Host settings namespace resolves. */
export const INITIAL_BOTTOM_GLASS = DEFAULT_BOTTOM_GLASS
