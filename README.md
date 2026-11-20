# DSH Self-used Plugins

English | [中文](README.zh.md)

Personal plugin archive for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).

This repository collects self-used DSH plugins without modifying the Harness source tree. Each plugin is a standalone npm package with its own dependencies, build configuration, tests, README, and Cordis bundle patch.

## Plugins

| Plugin | What it does | DSH compatibility |
|---|---|---|
| [`dsh-terminal-appearance`](./dsh-terminal-appearance) | Adds terminal palettes, ANSI colors, font-family controls, and font-size controls to the sidebar terminal. | `>=0.2.2-rc.3 <0.3.0` |
| [`dsh-im-chat-mockup`](./dsh-im-chat-mockup) | Decorates Chat like an instant-messaging interface with bubbles, solid backgrounds, background images, role names, current-model names, and last-updated times. | `>=0.2.2-rc.5 <0.3.0` |
| [`dsh-session-quick-switch`](./dsh-session-quick-switch) | Cycles through up to three Sessions viewed within the previous hour. Desktop defaults to `Ctrl+Tab`; the binding is editable in DSH shortcuts. | `>=0.2.2-rc.5 <0.3.0` |

DSH plugin APIs are still pre-stable. Review a plugin's README and rerun its tests after upgrading Harness.

## Install

Install a plugin into the Desktop profile from this repository root:

```sh
dsh plugin --profile desktop add ./dsh-terminal-appearance
dsh plugin --profile desktop add ./dsh-im-chat-mockup
dsh plugin --profile desktop add ./dsh-session-quick-switch
```

Use `--profile web` instead of `--profile desktop` for the Web profile.

Restart DSH after installing a plugin. Removing one is symmetric:

```sh
dsh plugin --profile desktop remove dsh-terminal-appearance
dsh plugin --profile desktop remove dsh-im-chat-mockup
dsh plugin --profile desktop remove dsh-session-quick-switch
```

## Development

Each directory is independent. Run the standard checks inside the plugin being changed:

```sh
cd dsh-terminal-appearance
pnpm install
pnpm test
pnpm typecheck
pnpm build
```

The same commands apply to `dsh-im-chat-mockup` and `dsh-session-quick-switch`.

Build outputs and installed dependencies are intentionally not archived:

```text
node_modules/
lib/
```

## Repository layout

```text
dsh-self-used-plugins/
├── dsh-terminal-appearance/
├── dsh-im-chat-mockup/
└── dsh-session-quick-switch/
```

## Notes

- This is a personal archive, not an official DeepSeek Harness distribution.
- Plugin behavior and compatibility notes are documented in each subdirectory's README.
- Local images selected by `dsh-im-chat-mockup` are stored in the browser, not in this repository.
- `dsh-session-quick-switch` stores only recent Session IDs and visit timestamps in browser local storage.
