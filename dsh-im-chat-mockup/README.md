# DSH IM Chat Mockup

`dsh-im-chat-mockup` adds an **Instant messaging chat** appearance row to DeepSeek Harness settings.

It preserves the native Chat renderer: Markdown, code blocks, diffs, tool cards, streaming, folded process rows, copy, and branching continue to use DSH behavior. The plugin only decorates existing message containers.

## Features

- User messages render as a chat bubble, a solid-color block, or a background-image card.
- The selected background image can be a bundled preset or a local image stored in IndexedDB.
- Sender and answerer names can be shown above messages.
- The sender name is configurable.
- The answerer name follows the current session model and updates when the model changes.
- Every user or answer message shows its last-updated time as `Month/Day Hour:Minute`.
- Light and dark application themes use DSH semantic color tokens.
- Message metadata reserves layout before streaming content arrives, so incremental LLM text does not change row height or move DSH's scroll anchor.

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
dsh plugin --profile web add ./dsh-im-chat-mockup
dsh --profile web --dump-config
dsh web
```

Remove it with:

```sh
dsh plugin --profile web remove dsh-im-chat-mockup
```

## Compatibility

The client feature recognizes DSH Chat's stable message markers:

- `data-chat-flow-kind`
- `data-chat-node-key`
- `data-chat-group-part`
- `data-message-bubble`

DSH client APIs are pre-stable. The package is intentionally pinned to the `0.2.2-rc.5` line. If a future DSH release removes these markers, the decorator leaves Chat untouched and the native renderer continues to work.

## Image storage

Bundled backgrounds are code assets inside the plugin. Uploaded images are stored as browser Blobs in IndexedDB; the DSH settings document stores only the image identifier. Clearing browser storage restores the configured fallback background without changing chat history.
