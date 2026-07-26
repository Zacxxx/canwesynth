# CanWeSynth agent guide

## Mission

Build an open, local-first, AI-native wavetable instrument platform. Treat
sound quality, real-time safety, saved-instrument compatibility, Linux support,
and user control as release requirements.

## Commands

- Install: `make install`
- Configure: `make configure`
- Build: `make build`
- Test: `make test`
- Lint: `make lint`
- Format: `make fmt`

## Invariants

- Never allocate, lock, perform I/O, invoke an agent, or parse JSON on the audio
  thread.
- Validate and semantically check every instrument before atomic replacement.
- Require an expected revision for mutating MCP operations.
- Never expose, copy, log, or persist Codex OAuth tokens. OAuth is owned by
  `codex app-server`.
- Never auto-approve app-server command or file-change requests.
- Preserve instrument schema compatibility or add a migration and fixtures.
- Keep third-party attribution and license records exact.
- Do not redistribute proprietary names, presets, wavetables, skins, or assets.

## Structure

Production C++ lives in `src/`, shared TypeScript packages in `packages/`, the
app-server adapter in `apps/`, and the installable Codex plugin in
`plugins/canwesynth/`. Tests mirror their production modules.
