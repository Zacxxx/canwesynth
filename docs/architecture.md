# Architecture

## Goals

CanWeSynth must satisfy three users without creating three incompatible
systems:

1. a musician editing an instrument visually;
2. a developer extending the engine;
3. Codex editing an instrument through tools.

All three converge on a versioned instrument document. The document describes
intent; the runtime decides how to implement it safely and efficiently.

## Components

### Instrument document

`.cwsynth.json` is the stable boundary. It contains metadata, engine settings,
nodes, typed port connections, and exposed macros. It does not contain native
code, shell commands, URLs to execute, or model prompts.

The TypeScript schema is currently the reference implementation. A generated
C++ representation will replace duplicate parsing logic before M1.

### Edit service

The CLI and MCP server call the same pure edit functions:

1. read and validate the current document;
2. calculate its canonical revision;
3. compare `expected_revision`;
4. apply one bounded operation;
5. validate schema and graph semantics;
6. write a temporary file and atomically replace the original.

This prevents a stale agent or UI panel from overwriting a newer user change.

### Graph compiler

The planned compiler resolves node types and ports, rejects unsupported cycles,
allocates a fixed execution plan, precomputes modulation routes, and publishes
an immutable graph snapshot to the audio engine. Publication uses an
audio-thread-safe handoff; compilation never occurs inside the callback.

### DSP engine

`src/common` contains framework-independent DSP. The first implementation
provides polyBLEP basic oscillators, envelopes, filtering, and voice
allocation. DPF is only a host wrapper, which lets the core remain testable
without a DAW.

### Codex plugin

The plugin contains:

- a concise instrument-design skill;
- a local stdio MCP server;
- tools that map one-to-one to shared edit operations.

Codex receives no privileged “write arbitrary code” shortcut. Novel DSP work
still happens through normal repository changes, reviews, builds, and tests.

### In-app Codex bridge

The standalone app may spawn `codex app-server` over stdio. The bridge:

- performs the required initialize handshake;
- reads account state;
- starts ChatGPT OAuth and opens the returned authorization URL;
- starts an instrument-scoped thread and streams turn events;
- presents approval requests to the user;
- never reads Codex credential storage or receives raw OAuth tokens.

App-server is experimental, so the adapter is isolated in `apps/codex-bridge`
and protocol bindings are regenerated and compatibility-tested per supported
Codex release.

## Real-time boundary

The callback may:

- read immutable graph state;
- update fixed-size voice and modulation state;
- write output buffers.

It may not:

- allocate or free heap memory;
- lock a mutex;
- access the filesystem or network;
- parse text or JSON;
- invoke Codex or MCP;
- log synchronously;
- rebuild the graph.

## Distribution targets

| Artifact | Runtime | Primary use |
|---|---|---|
| Linux x86_64 standalone | Native Linux | Play without a DAW |
| Linux VST3/CLAP | Native Linux | Reaper, Bitwig, Ardour, others |
| Windows x64 VST3 | Wine/Proton or Windows | FL Studio |

FL Studio under Wine/Proton is a Windows process and therefore needs the
Windows VST3. The Linux installer will detect common prefixes and copy that
artifact into `drive_c/Program Files/Common Files/VST3`.
