import type { Instrument } from "./schema";

export function createInstrumentTemplate(
  id: string,
  name: string,
): Instrument {
  return {
    schema_version: 1,
    id,
    name,
    description: "A new CanWeSynth instrument",
    author: "CanWeSynth User",
    license: "CC0-1.0",
    engine: {
      polyphony: 16,
      oversampling: 1,
    },
    nodes: [
      {
        id: "osc-1",
        type: "oscillator",
        parameters: {
          waveform: "saw",
          level: 0.8,
          detune_cents: 0,
        },
      },
      {
        id: "filter-1",
        type: "filter",
        parameters: {
          mode: "lowpass",
          cutoff_hz: 2400,
          resonance: 0.2,
          drive_db: 0,
        },
      },
      {
        id: "output",
        type: "output",
        parameters: {
          level: 0.8,
        },
      },
    ],
    connections: [
      {
        from: { node: "osc-1", port: "audio" },
        to: { node: "filter-1", port: "audio" },
        amount: 1,
      },
      {
        from: { node: "filter-1", port: "audio" },
        to: { node: "output", port: "audio" },
        amount: 1,
      },
    ],
    macros: [],
  };
}
