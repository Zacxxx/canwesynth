# Contributing to CanWeSynth

Thank you for helping build an open instrument platform. Contributions from
musicians, designers, writers, testers, and first-time audio developers are as
important as large DSP changes.

## Pick a tractable change

Look for `good first issue`, `help wanted`, or a roadmap checkbox. Before a
large architectural change, open a short proposal issue describing:

- the user problem;
- the smallest useful version;
- real-time or compatibility risks;
- how it will be tested.

Small pull requests are easier to review and release.

## Development setup

```bash
git clone --recurse-submodules https://github.com/Zacxxx/canwesynth.git
cd canwesynth
make install
make configure
make build
make test
make lint
```

Use Bun for the TypeScript workspace and CMake/Ninja for C++. Do not add a new
dependency when a small implementation or an existing dependency is enough.

## Project layout

- `src/common`: reusable real-time-safe DSP primitives
- `src/plugin`: DPF plugin and standalone wrapper
- `tests`: C++ tests mirroring `src`
- `packages/instrument-schema`: public instrument format and edits
- `packages/cli`: human-facing instrument CLI
- `apps/codex-bridge`: experimental app-server adapter
- `plugins/canwesynth`: distributable Codex plugin and MCP server
- `instruments`: redistributable example instruments
- `docs`: architecture and protocol decisions

## Quality bar

- Add a failing test before a behavioral fix.
- Keep the audio callback allocation-free, lock-free, and I/O-free.
- Validate agent writes before atomically replacing an instrument.
- Preserve backward compatibility or add a schema migration.
- Include before/after measurements for DSP performance changes.
- Run `make fmt`, `make lint`, and `make test`.

## Commit and pull request style

Use Conventional Commit prefixes such as `feat:`, `fix:`, `docs:`, `test:`,
`refactor:`, or `chore:`. Keep one logical change per commit.

Pull requests should explain what changed, why, the tests run, and the
user-facing impact. Include screenshots for UI changes and audio examples or
measurements for meaningful DSP changes.

## Licensing and provenance

By submitting a contribution, you agree that it is licensed under GPL-3.0-or-
later. Do not submit presets, samples, skins, or source code unless you have the
right to redistribute them.

When adapting compatible open-source code:

1. retain copyright and license notices;
2. add the source and exact revision to `THIRD_PARTY.md`;
3. identify modified files;
4. prefer contributing generally useful fixes upstream.

Do not copy proprietary plugin code, presets, wavetables, branding, or reverse-
engineered assets.

## Community

Follow [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Reviews should be direct,
kind, and about the work. Maintainers will favor working increments over
speculative rewrites.
