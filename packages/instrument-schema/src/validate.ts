import {
  instrumentSchema,
  type Connection,
  type Instrument,
  type InstrumentNode,
} from "./schema";

export type ValidationIssue = {
  path: string;
  message: string;
};

export type ValidationResult =
  | { valid: true; instrument: Instrument; issues: [] }
  | { valid: false; issues: ValidationIssue[] };

const ports: Record<
  InstrumentNode["type"],
  { inputs: ReadonlySet<string>; outputs: ReadonlySet<string> }
> = {
  oscillator: {
    inputs: new Set(["pitch", "level"]),
    outputs: new Set(["audio"]),
  },
  noise: {
    inputs: new Set(["level"]),
    outputs: new Set(["audio"]),
  },
  mixer: {
    inputs: new Set(["audio"]),
    outputs: new Set(["audio"]),
  },
  filter: {
    inputs: new Set(["audio", "cutoff", "resonance"]),
    outputs: new Set(["audio"]),
  },
  envelope: {
    inputs: new Set(["gate"]),
    outputs: new Set(["value"]),
  },
  lfo: {
    inputs: new Set(["rate"]),
    outputs: new Set(["value"]),
  },
  output: {
    inputs: new Set(["audio", "level"]),
    outputs: new Set(),
  },
};

function pathOf(path: PropertyKey[]): string {
  return path.length === 0 ? "$" : `$.${path.map(String).join(".")}`;
}

function hasAudioCycle(
  nodes: InstrumentNode[],
  connections: Connection[],
): boolean {
  const adjacency = new Map<string, string[]>(
    nodes.map((node) => [node.id, []]),
  );

  for (const connection of connections) {
    if (connection.from.port !== "audio" || connection.to.port !== "audio") {
      continue;
    }
    adjacency.get(connection.from.node)?.push(connection.to.node);
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (node: string): boolean => {
    if (visiting.has(node)) return true;
    if (visited.has(node)) return false;

    visiting.add(node);
    for (const next of adjacency.get(node) ?? []) {
      if (visit(next)) return true;
    }
    visiting.delete(node);
    visited.add(node);
    return false;
  };

  return nodes.some((node) => visit(node.id));
}

export function validateInstrument(input: unknown): ValidationResult {
  const parsed = instrumentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      valid: false,
      issues: parsed.error.issues.map((issue) => ({
        path: pathOf(issue.path),
        message: issue.message,
      })),
    };
  }

  const instrument = parsed.data;
  const issues: ValidationIssue[] = [];
  const nodes = new Map<string, InstrumentNode>();

  instrument.nodes.forEach((node, index) => {
    if (nodes.has(node.id)) {
      issues.push({
        path: `$.nodes.${index}.id`,
        message: `Duplicate node id "${node.id}"`,
      });
    }
    nodes.set(node.id, node);
  });

  const outputs = instrument.nodes.filter((node) => node.type === "output");
  if (outputs.length !== 1) {
    issues.push({
      path: "$.nodes",
      message: `Expected exactly one output node, found ${outputs.length}`,
    });
  }

  instrument.connections.forEach((connection, index) => {
    const source = nodes.get(connection.from.node);
    const target = nodes.get(connection.to.node);

    if (!source) {
      issues.push({
        path: `$.connections.${index}.from.node`,
        message: `Unknown source node "${connection.from.node}"`,
      });
    } else if (!ports[source.type].outputs.has(connection.from.port)) {
      issues.push({
        path: `$.connections.${index}.from.port`,
        message: `Node type "${source.type}" has no output port "${connection.from.port}"`,
      });
    }

    if (!target) {
      issues.push({
        path: `$.connections.${index}.to.node`,
        message: `Unknown target node "${connection.to.node}"`,
      });
    } else if (!ports[target.type].inputs.has(connection.to.port)) {
      issues.push({
        path: `$.connections.${index}.to.port`,
        message: `Node type "${target.type}" has no input port "${connection.to.port}"`,
      });
    }
  });

  instrument.macros.forEach((macro, macroIndex) => {
    macro.targets.forEach((target, targetIndex) => {
      const node = nodes.get(target.node);
      if (!node) {
        issues.push({
          path: `$.macros.${macroIndex}.targets.${targetIndex}.node`,
          message: `Unknown macro target node "${target.node}"`,
        });
        return;
      }
      if (!(target.parameter in node.parameters)) {
        issues.push({
          path: `$.macros.${macroIndex}.targets.${targetIndex}.parameter`,
          message: `Node "${target.node}" has no parameter "${target.parameter}"`,
        });
      }
    });
  });

  if (hasAudioCycle(instrument.nodes, instrument.connections)) {
    issues.push({
      path: "$.connections",
      message: "Audio-rate cycles are not supported in schema v1",
    });
  }

  return issues.length === 0
    ? { valid: true, instrument, issues: [] }
    : { valid: false, issues };
}
