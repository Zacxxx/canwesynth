# Instrument format v1

CanWeSynth instruments use the `.cwsynth.json` suffix and UTF-8 JSON.

## Design rules

- Unknown top-level and node fields are rejected.
- IDs are stable lower-case slugs.
- Connections refer to explicit node and port IDs.
- Every graph has exactly one output node.
- Audio cycles are rejected in v1.
- Values use normalized units only where the parameter explicitly says so.
- Documents include a schema version, but revisions are calculated rather than
  stored.

## Minimal example

```json
{
  "schema_version": 1,
  "id": "bright-saw",
  "name": "Bright Saw",
  "description": "A small subtractive instrument",
  "author": "CanWeSynth Community",
  "license": "CC0-1.0",
  "engine": {
    "polyphony": 16,
    "oversampling": 1
  },
  "nodes": [
    {
      "id": "osc-1",
      "type": "oscillator",
      "parameters": {
        "waveform": "saw",
        "level": 0.8,
        "detune_cents": 0
      }
    },
    {
      "id": "filter-1",
      "type": "filter",
      "parameters": {
        "mode": "lowpass",
        "cutoff_hz": 2400,
        "resonance": 0.2
      }
    },
    {
      "id": "output",
      "type": "output",
      "parameters": {
        "level": 0.8
      }
    }
  ],
  "connections": [
    {
      "from": { "node": "osc-1", "port": "audio" },
      "to": { "node": "filter-1", "port": "audio" },
      "amount": 1
    },
    {
      "from": { "node": "filter-1", "port": "audio" },
      "to": { "node": "output", "port": "audio" },
      "amount": 1
    }
  ],
  "macros": []
}
```

## Revision

The revision is a SHA-256 digest of canonical JSON with recursively sorted
object keys. Mutating tools require the caller's last observed revision. A
mismatch returns the current revision without changing the file.

The revision is concurrency control, not authorship or a cryptographic
signature.

## Compatibility

Readers must reject unsupported future schema versions rather than guessing.
When v2 is introduced, the schema package will include an explicit v1-to-v2
migration and fixtures that demonstrate semantic preservation.
