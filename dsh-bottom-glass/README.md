# DSH Bottom Glass

`dsh-bottom-glass` adds adjustable frosted glass across DeepSeek Harness's left sidebar, conversation surface, right sidebar, and bottom chat surfaces, including the full-width `shell.bottom` slot when that slot has content.

The plugin changes paint only. It does not alter the slot height, bottom-panel resizing, scrolling, keyboard bindings, or the content rendered by another plugin.

## Features

- A General settings row for enabling the effect, background strength, blur, and saturation.
- An optional Liquid Glass-inspired mode for the composer input and its buttons, with specular highlights, luminous edges, and a subtle contrast lift.
- Defaults aligned with DSH's native sidebar material so the result reads as glass rather than a near-opaque recolored panel.
- Matching glass treatment for both sidebars, the conversation surface, and the sticky chat composer.
- Transparent content roots for right-side terminal and file-browser tabs, including the xterm viewport.
- Matching glass on the composer input, goal, queue, todo, and statistics panels, with the statistics panel aligned to the goal strip width.
- Compact goal and statistics panels include a theme-aware surface tint, hairline edge, inner highlight, and soft shadow so they remain legible over visually empty backdrops.
- Transparent base surfaces for the same-origin Inspector document, so its DevTools content does not cover the glass with an opaque page.
- Live light/dark adaptation through DSH theme tokens.
- System Reduce Transparency support.
- Forced-colors fallback.
- Immediate restoration of the original bottom-slot background when the plugin is disabled or removed.

## Build

```sh
pnpm install
pnpm test
pnpm typecheck
pnpm build
```

## Install

From the directory containing this package:

```sh
dsh plugin --profile desktop add ./dsh-bottom-glass
dsh --profile desktop --dump-config
```

Restart DSH after installing. Remove it with:

```sh
dsh plugin --profile desktop remove dsh-bottom-glass
```

## Settings

Open `Settings → General → Bottom glass`.

- **Background strength** controls how much of the theme surface remains over the blur.
- **Blur** controls the backdrop blur radius.
- **Saturation** controls the color richness visible through the glass.
- **Liquid glass** adds optional specular highlights, luminous edges, and a subtle contrast lift.
- The switch controls the effect without disabling the whole plugin.

## Compatibility

DSH plugin APIs are pre-stable. This version targets `>=0.2.2-rc.5 <0.3.0`.

The runtime targets DSH's stable full-width slot row through `[data-shell-bottom]`, the sidebars through their Slot anchors, the center column's opaque AppFrame surface, the conversation root through `data-conversation-content`, Dockkit's opaque right-pane and empty-host surfaces, and the chat composer through `data-composer-seat`. It also removes the opaque background from the known `data-inspector-panel` wrapper so the outer glass can show through the wrapper itself.

The full-width slot reserves no height while empty. Open the Inspector with `Command+Shift+.` on macOS to inspect the effect. The plugin also injects a transparent-surface stylesheet into the same-origin Inspector `iframe`; it deliberately does not fade the DevTools text or controls with container `opacity`.
