import { z } from "zod";

const id = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/);

const finite = z.number().finite();
const normalized = finite.min(0).max(1);

export const oscillatorNodeSchema = z
  .object({
    id,
    type: z.literal("oscillator"),
    parameters: z
      .object({
        waveform: z.enum(["sine", "saw", "square", "triangle"]),
        level: normalized,
        detune_cents: finite.min(-1200).max(1200),
      })
      .strict(),
  })
  .strict();

export const noiseNodeSchema = z
  .object({
    id,
    type: z.literal("noise"),
    parameters: z
      .object({
        color: z.enum(["white", "pink"]),
        level: normalized,
        seed: z.number().int().min(0).max(0x7fffffff),
      })
      .strict(),
  })
  .strict();

export const mixerNodeSchema = z
  .object({
    id,
    type: z.literal("mixer"),
    parameters: z
      .object({
        level: normalized,
      })
      .strict(),
  })
  .strict();

export const filterNodeSchema = z
  .object({
    id,
    type: z.literal("filter"),
    parameters: z
      .object({
        mode: z.enum(["lowpass", "highpass", "bandpass"]),
        cutoff_hz: finite.min(20).max(24000),
        resonance: normalized,
        drive_db: finite.min(0).max(36).default(0),
      })
      .strict(),
  })
  .strict();

export const envelopeNodeSchema = z
  .object({
    id,
    type: z.literal("envelope"),
    parameters: z
      .object({
        attack_ms: finite.min(0.1).max(60000),
        decay_ms: finite.min(0.1).max(60000),
        sustain: normalized,
        release_ms: finite.min(0.1).max(60000),
      })
      .strict(),
  })
  .strict();

export const lfoNodeSchema = z
  .object({
    id,
    type: z.literal("lfo"),
    parameters: z
      .object({
        waveform: z.enum(["sine", "triangle", "saw-up", "saw-down", "square"]),
        rate_hz: finite.min(0.01).max(100),
        bipolar: z.boolean(),
        phase: normalized,
      })
      .strict(),
  })
  .strict();

export const outputNodeSchema = z
  .object({
    id,
    type: z.literal("output"),
    parameters: z
      .object({
        level: normalized,
      })
      .strict(),
  })
  .strict();

export const nodeSchema = z.discriminatedUnion("type", [
  oscillatorNodeSchema,
  noiseNodeSchema,
  mixerNodeSchema,
  filterNodeSchema,
  envelopeNodeSchema,
  lfoNodeSchema,
  outputNodeSchema,
]);

export const endpointSchema = z
  .object({
    node: id,
    port: id,
  })
  .strict();

export const connectionSchema = z
  .object({
    from: endpointSchema,
    to: endpointSchema,
    amount: finite.min(-1).max(1).default(1),
  })
  .strict();

export const macroSchema = z
  .object({
    id,
    name: z.string().min(1).max(40),
    default: normalized,
    targets: z
      .array(
        z
          .object({
            node: id,
            parameter: id,
            min: finite,
            max: finite,
            curve: z.enum(["linear", "exponential"]).default("linear"),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();

export const instrumentSchema = z
  .object({
    schema_version: z.literal(1),
    id,
    name: z.string().min(1).max(80),
    description: z.string().max(500),
    author: z.string().min(1).max(100),
    license: z.string().min(1).max(40),
    engine: z
      .object({
        polyphony: z.number().int().min(1).max(64),
        oversampling: z.union([z.literal(1), z.literal(2), z.literal(4)]),
      })
      .strict(),
    nodes: z.array(nodeSchema).min(1).max(256),
    connections: z.array(connectionSchema).max(1024),
    macros: z.array(macroSchema).max(16),
  })
  .strict();

export type Instrument = z.infer<typeof instrumentSchema>;
export type InstrumentNode = z.infer<typeof nodeSchema>;
export type Connection = z.infer<typeof connectionSchema>;
