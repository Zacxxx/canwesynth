import { describe, expect, test } from "bun:test";
import {
  createInstrumentTemplate,
  instrumentRevision,
  validateInstrument,
} from "../src";

describe("instrument schema", () => {
  test("accepts the default template", () => {
    const result = validateInstrument(
      createInstrumentTemplate("test-synth", "Test Synth"),
    );
    expect(result.valid).toBe(true);
  });

  test("rejects duplicate node ids", () => {
    const instrument = createInstrumentTemplate("test-synth", "Test Synth");
    instrument.nodes[1]!.id = "osc-1";

    const result = validateInstrument(instrument);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.issues.some((issue) => issue.message.includes("Duplicate"))).toBe(
        true,
      );
    }
  });

  test("rejects audio cycles", () => {
    const instrument = createInstrumentTemplate("test-synth", "Test Synth");
    instrument.connections.push({
      from: { node: "filter-1", port: "audio" },
      to: { node: "filter-1", port: "audio" },
      amount: 1,
    });

    const result = validateInstrument(instrument);
    expect(result.valid).toBe(false);
  });

  test("revision is independent of object key ordering", () => {
    expect(instrumentRevision({ a: 1, b: 2 })).toBe(
      instrumentRevision({ b: 2, a: 1 }),
    );
  });
});
