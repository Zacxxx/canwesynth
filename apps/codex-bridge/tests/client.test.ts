import { afterEach, describe, expect, test } from "bun:test";
import { join } from "node:path";
import { CodexAppServerClient } from "../src";

let client: CodexAppServerClient | null = null;

afterEach(() => {
  client?.stop();
  client = null;
});

describe("Codex app-server client", () => {
  test("performs initialize and returns the OAuth handoff URL", async () => {
    client = new CodexAppServerClient(process.execPath, [
      join(import.meta.dir, "fixture-app-server.ts"),
    ]);
    await client.start();
    const login = await client.startChatGptLogin();

    expect(login).toEqual({
      type: "chatgpt",
      loginId: "login-test",
      authUrl: "https://example.test/oauth",
    });
  });
});
