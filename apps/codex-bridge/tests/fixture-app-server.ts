import { createInterface } from "node:readline";

const lines = createInterface({ input: process.stdin });
lines.on("line", (line) => {
  const message = JSON.parse(line) as {
    id?: number;
    method: string;
    params?: Record<string, unknown>;
  };

  if (message.method === "initialize") {
    console.log(JSON.stringify({ id: message.id, result: { userAgent: "fake" } }));
  } else if (message.method === "account/read") {
    console.log(
      JSON.stringify({
        id: message.id,
        result: { account: null, requiresOpenaiAuth: true },
      }),
    );
  } else if (message.method === "account/login/start") {
    console.log(
      JSON.stringify({
        id: message.id,
        result: {
          type: "chatgpt",
          loginId: "login-test",
          authUrl: "https://example.test/oauth",
        },
      }),
    );
  }
});
