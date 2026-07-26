# ADR 0001: Declarative instruments

Status: accepted

## Context

Allowing a model to generate and hot-load arbitrary native DSP code would make
experimentation powerful but introduces crashes, non-determinism, build
toolchain coupling, and an unacceptable real-time and security boundary.

## Decision

Human and agent editors produce a versioned declarative instrument graph.
Only reviewed engine node implementations execute. Novel node development uses
the normal source contribution, test, benchmark, and review path.

## Consequences

- Most instrument creation is safe, fast, and undoable.
- The same document supports GUI, CLI, MCP, and preset exchange.
- New DSP primitives take longer because they require engine work.
- The graph format needs careful compatibility governance.
