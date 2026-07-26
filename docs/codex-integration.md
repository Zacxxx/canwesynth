# Codex integration

CanWeSynth integrates with Codex in two complementary directions.

## Codex uses CanWeSynth

The installable plugin gives Codex MCP tools for the same bounded operations
available to the visual editor:

- list and read instruments;
- create from a safe template;
- validate schema and graph semantics;
- add a supported node;
- connect typed ports;
- set a parameter using optimistic concurrency.

The `design-instruments` skill teaches Codex to inspect before mutating,
preserve revisions, make small audible changes, validate after every write, and
explain the resulting macro controls.

## CanWeSynth uses Codex

The standalone editor can use the local Codex app server as its coding
provider. The user signs in with ChatGPT through the app-server-owned OAuth
flow:

1. CanWeSynth starts `codex app-server` over stdio.
2. It sends `initialize` and `initialized`.
3. It calls `account/read`.
4. If needed, it calls `account/login/start` with `{ "type": "chatgpt" }`.
5. It opens the returned `authUrl` in the user's browser.
6. It waits for `account/login/completed`.
7. It starts a thread scoped to the selected instrument project.

CanWeSynth does not implement an OAuth client, read `~/.codex/auth.json`, or
receive access and refresh tokens. The local Codex installation owns account
state and token refresh.

## Approval model

App-server can ask the client to approve commands, file changes, permissions,
or tool input. The bridge emits these as application events. The UI must show
the action and require the user to decide. The bridge has no “approve all”
fallback.

Instrument MCP tools remain independently constrained to `.cwsynth.json`
files inside a selected project root.

## Protocol stability

Codex app-server is currently experimental. To keep that risk contained:

- the adapter is a separate package;
- only a small stable-looking method subset is used;
- generated protocol bindings are not hand-maintained;
- CI records the minimum tested Codex version;
- instrument files and the audio runtime never depend on app-server types.

The implementation was developed against Codex CLI `0.145.0`. Future releases
must run the bridge compatibility test before updating the supported version.
