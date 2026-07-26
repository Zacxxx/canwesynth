import { afterEach, describe, expect, test } from "bun:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { join, resolve } from "node:path";

let client: Client | null = null;

afterEach(async () => {
  await client?.close();
  client = null;
});

describe("CanWeSynth MCP server", () => {
  test("lists tools and reads a validated instrument", async () => {
    const repository = resolve(import.meta.dir, "../../../..");
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [join(import.meta.dir, "../src/index.ts")],
      env: {
        ...process.env,
        CANWESYNTH_PROJECT_ROOT: repository,
      },
    });
    client = new Client({ name: "canwesynth-test", version: "0.1.0" });
    await client.connect(transport);

    const tools = await client.listTools();
    expect(
      tools.tools.some((tool) => tool.name === "instrument_set_parameter"),
    ).toBe(true);

    const read = await client.callTool({
      name: "instrument_read",
      arguments: {
        path: "instruments/bright-saw.cwsynth.json",
      },
    });
    expect(read.isError).not.toBe(true);
    expect(JSON.stringify(read.structuredContent)).toContain('"bright-saw"');
  });
});
