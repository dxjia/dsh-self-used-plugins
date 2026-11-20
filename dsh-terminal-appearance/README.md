# DSH Terminal Appearance

`dsh-terminal-appearance` adds a **Terminal colors** row to DeepSeek Harness settings. It changes the sidebar terminal background, default foreground, selection surface, and standard ANSI 16 colors while leaving the built-in terminal process, fonts, font size, shortcuts, Agent terminals, and reconnect behavior untouched.

The plugin does not modify the DeepSeek Harness checkout. It is an out-of-tree profile bundle.

## Presets

- DSH default
- iTerm2 Homebrew
- Graphite
- Nord
- Tokyo Night
- Solarized
- Gruvbox

Each preset has a light and dark variant. The color mode can follow the application theme or force one variant. The existing terminal font family and 10-20 px terminal font size remain the single source of truth.

The settings row also includes a terminal-size stepper and font-family field. They write directly through the DSH theme service, so values stay synchronized with **Font size → More font settings** instead of creating a second preference.

The row is collapsed by default so it occupies a single settings entry. Its summary shows the active palette, color mode, terminal font size, and ANSI color strip; activating the row expands all appearance controls.

## Build

From this directory:

```sh
pnpm install
pnpm test
pnpm build
```

The build emits:

```text
lib/index.js
lib/client.js
```

## Install

From the directory containing this package:

```sh
dsh plugin --profile web add ./dsh-terminal-appearance
dsh --profile web --dump-config
dsh web
```

To remove it:

```sh
dsh plugin --profile web remove dsh-terminal-appearance
```

The bundle contributes the Loader row id `terminal-appearance`, which is also the Host settings namespace. Removing the bundle removes its settings row and stylesheet; the user-settings document keeps the saved section without affecting terminal rendering.

## Styling scope

The browser plugin installs one owned `<style data-plugin="dsh-terminal-appearance">` node. All generated rules are scoped to `[data-sidebar-terminal]`. The default preset leaves the stylesheet empty, so the terminal returns to its native DSH appearance immediately.

The plugin intentionally does not alter the global `--dsw-*` theme, cursor shape, terminal grid, PTY, shell session, or tab chrome. True-color and OSC colors set by running programs remain program-owned.

xterm can replace ANSI classes with contrast-adjusted inline colors. The plugin recognizes those default-ANSI results and remaps them to the selected palette; program-defined true-color and OSC values are left alone.
