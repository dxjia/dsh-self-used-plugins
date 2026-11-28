# DSH Floating Note

`dsh-floating-note` adds up to five small editable notes above the dsh content area. It is an independent plugin and does not require changes to the DeepSeek Harness source tree.

## Features

- A first-level **Notes** page beside **General** in Settings.
- A switch to show or hide the floating notes, plus a **New note** button that shows the current count out of five.
- Independent text, position, and size for every note. Each note's text is saved on its own, so notes never overwrite each other.
- A `+` button in each note header creates the next note; the button disables once five notes are open.
- A `×` button closes one note. A note that still has text asks for confirmation first.
- Native text editing with copy and paste support.
- Immediate browser-local persistence for every note and all display preferences.
- Controls for font size, font family, text color, and overall window opacity, shared by all notes.
- A draggable header and native resize handle, with the resulting position and size saved locally.
- Light and dark theme tokens from dsh, with localized Chinese and English copy.

The notes float within the dsh application window through the existing `shell.overlay` slot. They do not create separate operating-system windows.

An entry saved by the previous single-note version is migrated into the first note on load; its text and frame are preserved.

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
