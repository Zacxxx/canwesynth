#!/usr/bin/env bun

import {
  createInstrumentTemplate,
  readInstrument,
  setNodeParameter,
  validateInstrument,
  writeInstrument,
} from "@canwesynth/instrument-schema";

function usage(): never {
  console.error(`CanWeSynth instrument CLI

Usage:
  canwesynth create <path> --name <name> [--id <id>]
  canwesynth inspect <path>
  canwesynth validate <path>
  canwesynth set <path> <node> <parameter> <json-value> --revision <sha256>

Paths are resolved under the current working directory.`);
  process.exit(2);
}

function option(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  const [command, path, ...args] = process.argv.slice(2);
  if (!command || !path) usage();

  if (command === "create") {
    const name = option(args, "--name");
    if (!name) usage();
    const id = option(args, "--id") ?? slugify(name);
    const result = await writeInstrument(
      process.cwd(),
      path,
      createInstrumentTemplate(id, name),
    );
    console.log(
      JSON.stringify(
        { path: result.path, revision: result.revision, created: true },
        null,
        2,
      ),
    );
    return;
  }

  if (command === "inspect") {
    const result = await readInstrument(process.cwd(), path);
    console.log(
      JSON.stringify(
        {
          path: result.path,
          revision: result.revision,
          instrument: result.instrument,
        },
        null,
        2,
      ),
    );
    return;
  }

  if (command === "validate") {
    const result = await readInstrument(process.cwd(), path);
    const validation = validateInstrument(result.instrument);
    console.log(
      JSON.stringify(
        {
          path: result.path,
          revision: result.revision,
          valid: validation.valid,
          issues: validation.issues,
        },
        null,
        2,
      ),
    );
    return;
  }

  if (command === "set") {
    const [node, parameter, encoded] = args;
    const revision = option(args, "--revision");
    if (!node || !parameter || encoded === undefined || !revision) usage();

    let value: unknown;
    try {
      value = JSON.parse(encoded);
    } catch {
      throw new Error("The parameter value must be valid JSON");
    }

    const result = await setNodeParameter(
      process.cwd(),
      path,
      revision,
      node,
      parameter,
      value,
    );
    console.log(
      JSON.stringify(
        { path: result.path, revision: result.revision, updated: true },
        null,
        2,
      ),
    );
    return;
  }

  usage();
}

main().catch((error: unknown) => {
  console.error(
    JSON.stringify(
      {
        error: error instanceof Error ? error.message : String(error),
        code:
          error && typeof error === "object" && "code" in error
            ? error.code
            : "UNEXPECTED",
        details:
          error && typeof error === "object" && "details" in error
            ? error.details
            : undefined,
      },
      null,
      2,
    ),
  );
  process.exit(1);
});
