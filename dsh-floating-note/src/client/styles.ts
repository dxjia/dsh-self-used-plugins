import type { Context } from '@deepseek-ai/cordis'

const CSS = `
.dsh-floating-note {
  box-sizing: border-box;
  position: absolute;
  display: flex;
  flex-direction: column;
  min-width: 260px;
  min-height: 220px;
  max-width: calc(100% - 16px);
  max-height: calc(100% - 56px);
  overflow: hidden;
  resize: both;
  z-index: 30;
  border: 0.5px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-lg);
  background: var(--dsw-alias-bg-layer-1);
  box-shadow: 0 14px 38px rgb(0 0 0 / 22%);
}
.dsh-floating-note__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 36px;
  padding: 4px 8px 4px 12px;
  border-bottom: 0.5px solid var(--dsw-alias-border-l2);
  color: var(--dsw-alias-label-secondary);
  cursor: grab;
  user-select: none;
  touch-action: none;
}
.dsh-floating-note__header:active { cursor: grabbing; }
.dsh-floating-note__title {
  overflow: hidden;
  font-size: 12px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dsh-floating-note__hide {
  display: inline-grid;
  width: 26px;
  height: 26px;
  place-items: center;
  border: 0;
  border-radius: var(--dsw-radius-xs);
  background: transparent;
  color: inherit;
  cursor: pointer;
}
@media (hover: hover) {
  .dsh-floating-note__hide:hover { background: var(--dsw-alias-interactive-bg-hover); }
}
.dsh-floating-note__editor {
  flex: 1;
  width: 100%;
  min-height: 0;
  padding: 12px;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--dsh-floating-note-color);
  font-family: var(--dsh-floating-note-font-family);
  font-size: var(--dsh-floating-note-font-size);
  line-height: 1.5;
  resize: none;
}
.dsh-floating-note__editor::placeholder { color: var(--dsw-alias-label-tertiary); }
.dsh-floating-note-settings {
  display: grid;
  gap: 24px;
  max-width: 720px;
}
.dsh-floating-note-settings__intro {
  color: var(--dsw-alias-label-secondary);
  font-size: 13px;
  line-height: 20px;
}
.dsh-floating-note-settings__row {
  display: grid;
  grid-template-columns: minmax(140px, 1fr) minmax(140px, 260px);
  align-items: center;
  gap: 20px;
  padding: 14px 0;
  border-bottom: 0.5px solid var(--dsw-alias-border-l2);
}
.dsh-floating-note-settings__label { font-size: 14px; line-height: 20px; }
.dsh-floating-note-settings__control { display: flex; align-items: center; gap: 10px; min-width: 0; }
.dsh-floating-note-settings__control input[type='range'] {
  width: 100%;
  accent-color: var(--dsw-alias-brand-primary);
}
.dsh-floating-note-settings__control select,
.dsh-floating-note-settings__control input[type='color'] {
  width: 100%;
  min-height: 32px;
  border: 0.5px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-sm);
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
}
.dsh-floating-note-settings__control input[type='color'] { width: 44px; padding: 3px; }
.dsh-floating-note-settings__value {
  min-width: 52px;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  text-align: right;
}
@media (max-width: 640px) {
  .dsh-floating-note-settings__row { grid-template-columns: 1fr; gap: 8px; }
}
`

/** Install the plugin-owned stylesheet for the browser plugin lifetime. */
export function installStyles(ctx: Context): void {
  ctx.effect(() => {
    if (typeof document === 'undefined') return () => {}
    const style = document.createElement('style')
    style.dataset.plugin = 'dsh-floating-note'
    style.dataset.path = 'floating-note.css'
    style.textContent = CSS
    document.head.append(style)
    return () => { style.remove() }
  }, 'floating-note: styles')
}
