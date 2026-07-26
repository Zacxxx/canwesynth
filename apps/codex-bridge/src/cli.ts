#!/usr/bin/env bun

import { CodexAppServerClient } from "./client";

async function main() {
  const client = new CodexAppServerClient();
  client.on("diagnostic", (message) => process.stderr.write(message));
  client.on("serverRequest", (request) => {
    console.error(
      `Approval required: ${request.method}\n${JSON.stringify(request.params, null, 2)}`,
    );
    console.error("The demo CLI does not auto-approve app-server requests.");
  });
  await client.start();

  const command = process.argv[2] ?? "status";
  if (command === "status") {
    console.log(JSON.stringify(await client.account(), null, 2));
  } else if (command === "login") {
    console.log(JSON.stringify(await client.startChatGptLogin(), null, 2));
  } else if (command === "prompt") {
    const prompt = process.argv.slice(3).join(" ");
    if (!prompt) throw new Error("Provide a prompt");
    const root = process.cwd();
    const threadId = await client.startInstrumentThread(root);
    const turnId = await client.prompt(threadId, prompt, root);
    console.log(JSON.stringify({ threadId, turnId }, null, 2));
  } else {
    throw new Error(`Unknown command "${command}"`);
  }
  client.stop();
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
