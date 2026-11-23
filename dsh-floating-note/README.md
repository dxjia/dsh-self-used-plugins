# DSH Floating Note

`dsh-floating-note` adds a small editable note above the dsh content area. It is an independent plugin and does not require changes to the DeepSeek Harness source tree.

## Features

- A first-level **Notes** page beside **General** in Settings.
- A switch to show or hide the floating note.
- Native text editing with copy and paste support.
- Immediate browser-local persistence for the note text and all display preferences.
- Controls for font size, font family, text color, and overall window opacity.
- A draggable header and native resize handle, with the resulting size saved locally.
- Light and dark theme tokens from dsh, with localized Chinese and English copy.

The note floats within the dsh application window through the existing `shell.overlay` slot. It does not create a separate operating-system window.

## Build and test

```sh
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

## Install

From the directory containing this package:

```sh
dsh plugin --profile desktop add ./dsh-floating-note
dsh --profile desktop --dump-config
```

Restart dsh after installing. Remove it with:

```sh
dsh plugin --profile desktop remove dsh-floating-note
```

## Compatibility

DSH plugin APIs are pre-stable. This version targets `>=0.2.2-rc.5 <0.3.0`.
