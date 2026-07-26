# Instrument format reference

## Nodes and ports

| Type | Inputs | Outputs | Purpose |
|---|---|---|---|
| `oscillator` | `pitch`, `level` | `audio` | Sine, saw, square, or triangle source |
| `noise` | `level` | `audio` | White or pink noise |
| `mixer` | `audio` | `audio` | Sum audio routes |
| `filter` | `audio`, `cutoff`, `resonance` | `audio` | Low/high/band-pass shaping |
| `envelope` | `gate` | `value` | ADSR modulation |
| `lfo` | `rate` | `value` | Periodic modulation |
| `output` | `audio`, `level` | none | Required single graph output |

Audio connects `audio` to `audio`. Modulators connect `value` to supported
parameter ports. Schema v1 rejects audio cycles.

## Important ranges

- oscillator `level`: 0 to 1
- oscillator `detune_cents`: -1200 to 1200
- filter `cutoff_hz`: 20 to 24000
- filter `resonance`: 0 to 1
- filter `drive_db`: 0 to 36
- envelope times: 0.1 to 60000 ms
- envelope `sustain`: 0 to 1
- LFO `rate_hz`: 0.01 to 100
- connection `amount`: -1 to 1
- output `level`: 0 to 1

Keep initial output level at or below 0.8. Use a mixer before output when
combining multiple audio sources.
