# Roadmap

The roadmap is organized around playable milestones. Dates are deliberately
omitted until the contributor group has reliable throughput.

## M0 — Open foundation (current)

- [x] Public architecture and contribution model
- [x] Versioned instrument schema with semantic validation
- [x] Transactional CLI and MCP editing surface
- [x] Codex app-server OAuth/client adapter
- [x] Playable polyphonic DSP core
- [x] VST3, CLAP, and JACK build targets through DPF
- [x] Linux and Windows CI foundations
- [ ] First community issue triage and maintainer nominations

## M1 — A useful subtractive synth

- [ ] Two oscillators plus sub and noise
- [ ] 16-voice polyphony and deterministic voice stealing
- [ ] Two filters with stable modulation
- [ ] Three envelopes and four LFOs
- [ ] Modulation matrix and macros
- [ ] Preset browser and undo/redo
- [ ] Minimal accessible native UI
- [ ] Linux bundle plus Windows VST3 installer for FL Studio/Wine

Exit criterion: musicians can complete and reopen a track without experimental
flags or manual file copying.

## M2 — Wavetable instrument

- [ ] WAV and Serum-compatible single-cycle import where legally permitted
- [ ] Mipmapped wavetable playback
- [ ] Unison with stereo distribution and phase controls
- [ ] Warp modes with anti-aliasing benchmarks
- [ ] Visual wavetable editor
- [ ] Sample/noise oscillator
- [ ] Oversampling and quality modes

Exit criterion: a blind sound-design comparison is competitive with mature
free wavetable synths for the supported feature set.

## M3 — AI-native instrument studio

- [ ] Visual graph editor backed by the public instrument schema
- [ ] In-app Codex prompt and streamed change review
- [ ] OAuth onboarding through the local Codex app server
- [ ] Before/after audio previews for agent changes
- [ ] Parameter and graph diff UI
- [ ] Revert, fork, and provenance metadata
- [ ] Instrument-design evaluations and safety corpus

Exit criterion: a user can describe, audition, refine, and export an instrument
without hand-editing JSON, while every change remains reviewable.

## M4 — Serum-class breadth

- [ ] Advanced spectral and wavetable operations
- [ ] Flexible routing and effect rack
- [ ] MPE and microtuning
- [ ] Modulation rate/audio-rate quality tiers
- [ ] High-DPI GPU-accelerated visualizations
- [ ] Large, redistributable community preset library
- [ ] Reproducible signed releases and update channel

“Serum-class” is a quality target, not a compatibility or branding claim.
