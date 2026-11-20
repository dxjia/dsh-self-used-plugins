# DSH Session Quick Switch

`dsh-session-quick-switch` cycles among the three most recently viewed ordinary Sessions in DeepSeek Harness.

## Behavior

- Tracks actual main-view navigation, not message-update timestamps.
- Records the wall-clock time each Session becomes the main view.
- Only Sessions viewed within the previous 60 minutes participate; when fewer than two qualify, the shortcut passes through without switching.
- With three sessions visited as `A → B → C`, repeated shortcut presses cycle `C → B → A → C`.
- Visiting another Session by mouse, search, or another command rebuilds the three-session cycle around the new visit.
- Archived Sessions, subagent-origin Sessions, removed Sessions, and the current Session are not navigation targets.
- Session IDs are persisted in browser local storage; no conversation content is stored.
- Switching uses `ctx.uiWorkspace.openSession()`, so running turns continue and existing per-Session drafts remain intact.

## Shortcut

The default is **Ctrl+Tab** on macOS and Windows Desktop. Web and Linux do not receive this default because the browser or platform reserves the combination.

The command is editable under **Settings → Keyboard shortcuts**. Web users can assign another allowed binding there.

## Compatibility

This archived version supports:

```text
dsh >=0.2.2-rc.5 <0.3.0
```

## Build

```sh
pnpm install
pnpm test
pnpm typecheck
pnpm build
```

## Install

```sh
dsh plugin --profile desktop add ./dsh-session-quick-switch
```

Remove it with:

```sh
dsh plugin --profile desktop remove dsh-session-quick-switch
```
