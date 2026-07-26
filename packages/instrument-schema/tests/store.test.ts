import { describe, expect, test } from "bun:test";
import { mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  createInstrumentTemplate,
  InstrumentError,
  readInstrument,
  setNodeParameter,
  writeInstrument,
} from "../src";

describe("instrument store", () => {
  test("writes, reads, and revision-checks an edit", async () => {
    const root = await mkdtemp(join(tmpdir(), "canwesynth-test-"));
    const created = await writeInstrument(
      root,
      "instruments/test.cwsynth.json",
      createInstrumentTemplate("test", "Test"),
    );
    const changed = await setNodeParameter(
      root,
      "instruments/test.cwsynth.json",
      created.revision,
      "filter-1",
      "cutoff_hz",
      1200,
    );

    expect(changed.revision).not.toBe(created.revision);
    const read = await readInstrument(root, "instruments/test.cwsynth.json");
    const filter = read.instrument.nodes.find((node) => node.id === "filter-1");
    expect(filter?.type).toBe("filter");
    if (!filter || filter.type !== "filter") {
      throw new Error("Expected filter-1 to be a filter node");
    }
    expect(filter.parameters.cutoff_hz).toBe(1200);
  });

  test("rejects stale edits", async () => {
    const root = await mkdtemp(join(tmpdir(), "canwesynth-test-"));
    await writeInstrument(
      root,
      "instruments/test.cwsynth.json",
      createInstrumentTemplate("test", "Test"),
    );

    expect(
      setNodeParameter(
        root,
        "instruments/test.cwsynth.json",
        "stale",
        "filter-1",
        "cutoff_hz",
        1200,
      ),
    ).rejects.toBeInstanceOf(InstrumentError);
  });

  test("rejects paths outside the project root", async () => {
    const root = await mkdtemp(join(tmpdir(), "canwesynth-test-"));
    expect(readInstrument(root, "../escape.cwsynth.json")).rejects.toMatchObject(
      { code: "INVALID_PATH" },
    );
  });
});
