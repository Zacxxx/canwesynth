#!/usr/bin/env bun

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  addNode,
  connectNodes,
  createInstrumentTemplate,
  InstrumentError,
  nodeSchema,
  readInstrument,
  setNodeParameter,
  validateInstrument,
  writeInstrument,
} from "@canwesynth/instrument-schema";
import { readdir } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { z } from "zod";

const server = new McpServer(
  {
    name: "canwesynth",
    version: "0.1.0",
  },
  {
    instructions:
      "Read an instrument before changing it. Mutations require the exact revision returned by the latest read. Make small edits, validate afterward, and never edit files outside the selected project root.",
  },
);

const projectRoot = z
  .string()
  .optional()
  .describe(
    "Absolute project root. Defaults to CANWESYNTH_PROJECT_ROOT or the MCP process working directory.",
  );
const instrumentPath = z
  .string()
  .describe("Path to a .cwsynth.json file relative to the project root.");
const revision = z
  .string()
  .length(64)
  .describe("Exact revision returned by the most recent instrument read.");

function root(input?: string): string {
  return resolve(
    input ??
      process.env.CANWESYNTH_PROJECT_ROOT ??
      process.env.CODEX_WORKSPACE_ROOT ??
      process.cwd(),
  );
}

function result(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
    structuredContent:
      value !== null && typeof value === "object"
        ? (value as Record<string, unknown>)
        : { value },
  };
}

function failure(error: unknown) {
  const body = {
    error: error instanceof Error ? error.message : String(error),
    code: error instanceof InstrumentError ? error.code : "UNEXPECTED",
    details: error instanceof InstrumentError ? error.details : undefined,
  };
  return {
    ...result(body),
    isError: true,
  };
}

async function listInstrumentFiles(directory: string): Promise<string[]> {
  const output: string[] = [];
  const visit = async (current: string) => {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      if (entry.name === ".git" || entry.name === "node_modules") continue;
      const path = join(current, entry.name);
      if (entry.isDirectory()) {
        await visit(path);
      } else if (entry.isFile() && entry.name.endsWith(".cwsynth.json")) {
        output.push(relative(directory, path));
      }
    }
  };
  await visit(directory);
  return output.sort();
}

server.registerTool(
  "instrument_list",
  {
    title: "List CanWeSynth instruments",
    description: "List instrument documents inside a project root.",
    inputSchema: z.object({ project_root: projectRoot }),
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  async ({ project_root }) => {
    try {
      return result({ instruments: await listInstrumentFiles(root(project_root)) });
    } catch (error) {
      return failure(error);
    }
  },
);

server.registerTool(
  "instrument_read",
  {
    title: "Read a CanWeSynth instrument",
    description:
      "Read and validate an instrument, returning the exact revision required for edits.",
    inputSchema: z.object({
      project_root: projectRoot,
      path: instrumentPath,
    }),
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  async ({ project_root, path }) => {
    try {
      const read = await readInstrument(root(project_root), path);
      return result({
        path: relative(root(project_root), read.path),
        revision: read.revision,
        instrument: read.instrument,
      });
    } catch (error) {
      return failure(error);
    }
  },
);

server.registerTool(
  "instrument_validate",
  {
    title: "Validate a CanWeSynth instrument",
    description: "Validate schema, ports, references, and graph semantics.",
    inputSchema: z.object({
      project_root: projectRoot,
      path: instrumentPath,
    }),
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  async ({ project_root, path }) => {
    try {
      const read = await readInstrument(root(project_root), path);
      const validation = validateInstrument(read.instrument);
      return result({
        valid: validation.valid,
        issues: validation.issues,
        revision: read.revision,
      });
    } catch (error) {
      return failure(error);
    }
  },
);

server.registerTool(
  "instrument_create",
  {
    title: "Create a CanWeSynth instrument",
    description: "Create a safe, connected subtractive instrument template.",
    inputSchema: z.object({
      project_root: projectRoot,
      path: instrumentPath,
      id: z.string(),
      name: z.string(),
    }),
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: false,
    },
  },
  async ({ project_root, path, id, name }) => {
    try {
      const created = await writeInstrument(
        root(project_root),
        path,
        createInstrumentTemplate(id, name),
      );
      return result({ path, revision: created.revision, created: true });
    } catch (error) {
      return failure(error);
    }
  },
);

server.registerTool(
  "instrument_set_parameter",
  {
    title: "Set an instrument parameter",
    description:
      "Transactionally set one existing node parameter using an expected revision.",
    inputSchema: z.object({
      project_root: projectRoot,
      path: instrumentPath,
      expected_revision: revision,
      node_id: z.string(),
      parameter: z.string(),
      value: z.unknown(),
    }),
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: false,
    },
  },
  async ({
    project_root,
    path,
    expected_revision,
    node_id,
    parameter,
    value,
  }) => {
    try {
      const updated = await setNodeParameter(
        root(project_root),
        path,
        expected_revision,
        node_id,
        parameter,
        value,
      );
      return result({ path, revision: updated.revision, updated: true });
    } catch (error) {
      return failure(error);
    }
  },
);

server.registerTool(
  "instrument_add_node",
  {
    title: "Add an instrument node",
    description:
      "Transactionally add one supported node. A separate connection is required.",
    inputSchema: z.object({
      project_root: projectRoot,
      path: instrumentPath,
      expected_revision: revision,
      node: nodeSchema,
    }),
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: false,
    },
  },
  async ({ project_root, path, expected_revision, node }) => {
    try {
      const updated = await addNode(
        root(project_root),
        path,
        expected_revision,
        node,
      );
      return result({ path, revision: updated.revision, updated: true });
    } catch (error) {
      return failure(error);
    }
  },
);

server.registerTool(
  "instrument_connect",
  {
    title: "Connect instrument nodes",
    description:
      "Transactionally connect an existing source port to an existing target port.",
    inputSchema: z.object({
      project_root: projectRoot,
      path: instrumentPath,
      expected_revision: revision,
      from_node: z.string(),
      from_port: z.string(),
      to_node: z.string(),
      to_port: z.string(),
      amount: z.number().min(-1).max(1).default(1),
    }),
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: false,
    },
  },
  async ({
    project_root,
    path,
    expected_revision,
    from_node,
    from_port,
    to_node,
    to_port,
    amount,
  }) => {
    try {
      const updated = await connectNodes(
        root(project_root),
        path,
        expected_revision,
        {
          from: { node: from_node, port: from_port },
          to: { node: to_node, port: to_port },
          amount,
        },
      );
      return result({ path, revision: updated.revision, updated: true });
    } catch (error) {
      return failure(error);
    }
  },
);

await server.connect(new StdioServerTransport());
