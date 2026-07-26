import { dirname, relative, resolve, sep } from "node:path";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { instrumentRevision } from "./revision";
import { type Instrument, type InstrumentNode } from "./schema";
import { validateInstrument } from "./validate";

export class InstrumentError extends Error {
  constructor(
    message: string,
    readonly code:
      | "INVALID_PATH"
      | "INVALID_INSTRUMENT"
      | "REVISION_CONFLICT"
      | "NOT_FOUND",
    readonly details?: unknown,
  ) {
    super(message);
  }
}

export function resolveInstrumentPath(projectRoot: string, inputPath: string) {
  const root = resolve(projectRoot);
  const path = resolve(root, inputPath);
  const child = relative(root, path);

  if (
    child === "" ||
    child === ".." ||
    child.startsWith(`..${sep}`) ||
    !path.endsWith(".cwsynth.json")
  ) {
    throw new InstrumentError(
      "Instrument path must be a .cwsynth.json file inside the project root",
      "INVALID_PATH",
    );
  }
  return path;
}

export async function readInstrument(
  projectRoot: string,
  inputPath: string,
): Promise<{ instrument: Instrument; revision: string; path: string }> {
  const path = resolveInstrumentPath(projectRoot, inputPath);
  let raw: string;
  try {
    raw = await readFile(path, "utf8");
  } catch (error) {
    throw new InstrumentError(
      `Could not read instrument: ${(error as Error).message}`,
      "NOT_FOUND",
    );
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (error) {
    throw new InstrumentError(
      `Instrument contains invalid JSON: ${(error as Error).message}`,
      "INVALID_INSTRUMENT",
    );
  }

  const result = validateInstrument(json);
  if (!result.valid) {
    throw new InstrumentError(
      "Instrument validation failed",
      "INVALID_INSTRUMENT",
      result.issues,
    );
  }

  return {
    instrument: result.instrument,
    revision: instrumentRevision(result.instrument),
    path,
  };
}

export async function writeInstrument(
  projectRoot: string,
  inputPath: string,
  instrument: unknown,
): Promise<{ instrument: Instrument; revision: string; path: string }> {
  const path = resolveInstrumentPath(projectRoot, inputPath);
  const result = validateInstrument(instrument);
  if (!result.valid) {
    throw new InstrumentError(
      "Instrument validation failed",
      "INVALID_INSTRUMENT",
      result.issues,
    );
  }

  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${randomUUID()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(result.instrument, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o644,
    flag: "wx",
  });
  await rename(temporary, path);

  return {
    instrument: result.instrument,
    revision: instrumentRevision(result.instrument),
    path,
  };
}

export async function editInstrument(
  projectRoot: string,
  inputPath: string,
  expectedRevision: string,
  edit: (instrument: Instrument) => Instrument,
) {
  const current = await readInstrument(projectRoot, inputPath);
  if (current.revision !== expectedRevision) {
    throw new InstrumentError(
      "Instrument changed since it was read",
      "REVISION_CONFLICT",
      { current_revision: current.revision },
    );
  }

  return writeInstrument(
    projectRoot,
    inputPath,
    edit(structuredClone(current.instrument)),
  );
}

export async function setNodeParameter(
  projectRoot: string,
  inputPath: string,
  expectedRevision: string,
  nodeId: string,
  parameter: string,
  value: unknown,
) {
  return editInstrument(
    projectRoot,
    inputPath,
    expectedRevision,
    (instrument) => {
      const node = instrument.nodes.find((candidate) => candidate.id === nodeId);
      if (!node) {
        throw new InstrumentError(
          `Unknown node "${nodeId}"`,
          "INVALID_INSTRUMENT",
        );
      }
      if (!(parameter in node.parameters)) {
        throw new InstrumentError(
          `Node "${nodeId}" has no parameter "${parameter}"`,
          "INVALID_INSTRUMENT",
        );
      }

      (node.parameters as Record<string, unknown>)[parameter] = value;
      return instrument;
    },
  );
}

export async function addNode(
  projectRoot: string,
  inputPath: string,
  expectedRevision: string,
  node: InstrumentNode,
) {
  return editInstrument(
    projectRoot,
    inputPath,
    expectedRevision,
    (instrument) => {
      instrument.nodes.push(node);
      return instrument;
    },
  );
}

export async function connectNodes(
  projectRoot: string,
  inputPath: string,
  expectedRevision: string,
  connection: Instrument["connections"][number],
) {
  return editInstrument(
    projectRoot,
    inputPath,
    expectedRevision,
    (instrument) => {
      instrument.connections.push(connection);
      return instrument;
    },
  );
}
