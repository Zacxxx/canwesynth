# Third-party projects

CanWeSynth depends on and learns from excellent open-source projects.

## Runtime and build dependencies

| Project | Purpose | License |
|---|---|---|
| [DPF](https://github.com/DISTRHO/DPF) | VST3, CLAP, and standalone plugin framework | ISC |
| [Zod](https://github.com/colinhacks/zod) | Instrument document validation | MIT |
| [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) | Codex MCP server | MIT |

Exact dependency revisions are recorded in lockfiles and git submodules.

## Planned DSP ecosystem evaluation

The following GPL-3.0 projects are candidates for carefully attributed,
component-level integration after benchmarks and architecture review:

- [sst-basic-blocks](https://github.com/surge-synthesizer/sst-basic-blocks)
- [sst-filters](https://github.com/surge-synthesizer/sst-filters)
- [sst-waveshapers](https://github.com/surge-synthesizer/sst-waveshapers)
- [sst-effects](https://github.com/surge-synthesizer/sst-effects)

Vital and Vaporizer2 are important product references, but this repository does
not currently include their source, branding, presets, wavetables, or services.
