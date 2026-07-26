---
name: design-instruments
description: Create, inspect, explain, and refine CanWeSynth .cwsynth.json instruments through the bundled MCP tools. Use when a user asks Codex to design a synth sound, change an instrument, add or connect supported DSP nodes, tune parameters, validate an instrument graph, or explain a CanWeSynth patch.
---

# Design CanWeSynth instruments

Use the bundled `instruments` MCP server. Do not hand-edit an instrument when a
matching tool exists.

## Workflow

1. List instruments when the target is not explicit.
2. Read the target immediately before any mutation.
3. Translate the user's sound description into the smallest useful change.
4. Pass the exact latest revision to one mutating tool.
5. Read again because every mutation returns a new revision.
6. Validate the final document.
7. Summarize the audible change and the most important playable controls.

When creating an instrument, start with `instrument_create`, then build it in
small validated steps.

## Guardrails

- Keep all paths inside the selected project root.
- Never guess a revision or retry a revision conflict blindly; reread first.
- Never remove or overwrite an existing instrument unless explicitly asked.
- Prefer parameter changes before graph changes.
- Preserve stable node IDs and macro meanings.
- Keep output levels conservative and warn about feedback or extreme resonance.
- Do not claim audio quality from schema validation alone.
- Do not copy proprietary presets, wavetables, names, skins, or assets.
- For a new node type or DSP algorithm, switch to normal repository
  implementation with tests; instrument tools only use supported nodes.

Read [references/format.md](references/format.md) when selecting nodes, ports,
or parameter ranges.
