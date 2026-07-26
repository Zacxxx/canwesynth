import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { EventEmitter } from "node:events";
import { createInterface } from "node:readline";

type JsonObject = Record<string, unknown>;

export type AccountState = {
  account: null | {
    type: string;
    email?: string | null;
    planType?: string;
  };
  requiresOpenaiAuth: boolean;
};

export type LoginStart =
  | { type: "already-authenticated" }
  | { type: "chatgpt"; loginId: string; authUrl: string };

export type ApprovalRequest = {
  id: string | number;
  method: string;
  params: JsonObject;
  respond: (result: unknown) => void;
};

type Pending = {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
};

export class CodexAppServerClient extends EventEmitter {
  private process: ChildProcessWithoutNullStreams | null = null;
  private nextId = 1;
  private pending = new Map<string | number, Pending>();

  constructor(
    private readonly command = process.env.CANWESYNTH_CODEX_BIN ?? "codex",
    private readonly args = ["app-server", "--listen", "stdio://"],
  ) {
    super();
  }

  async start(): Promise<void> {
    if (this.process) return;

    const child = spawn(this.command, this.args, {
      stdio: ["pipe", "pipe", "pipe"],
      env: process.env,
    });
    this.process = child;
    child.stderr.on("data", (chunk) =>
      this.emit("diagnostic", chunk.toString()),
    );
    child.on("exit", (code, signal) => {
      const error = new Error(
        `codex app-server exited (code=${String(code)}, signal=${String(signal)})`,
      );
      for (const pending of this.pending.values()) pending.reject(error);
      this.pending.clear();
      this.process = null;
      this.emit("exit", { code, signal });
    });

    const lines = createInterface({ input: child.stdout });
    lines.on("line", (line) => this.receive(line));

    await this.request("initialize", {
      clientInfo: {
        name: "canwesynth",
        title: "CanWeSynth",
        version: "0.1.0",
      },
      capabilities: null,
    });
    this.notify("initialized", {});
  }

  stop(): void {
    this.process?.kill("SIGTERM");
  }

  request(method: string, params: unknown): Promise<unknown> {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      try {
        this.send({ method, id, params });
      } catch (error) {
        this.pending.delete(id);
        reject(error);
      }
    });
  }

  notify(method: string, params: unknown): void {
    this.send({ method, params });
  }

  async account(): Promise<AccountState> {
    return (await this.request("account/read", {
      refreshToken: false,
    })) as AccountState;
  }

  async startChatGptLogin(): Promise<LoginStart> {
    const state = await this.account();
    if (state.account?.type === "chatgpt") {
      return { type: "already-authenticated" };
    }

    const response = (await this.request("account/login/start", {
      type: "chatgpt",
      codexStreamlinedLogin: true,
      useHostedLoginSuccessPage: true,
      appBrand: "codex",
    })) as JsonObject;

    if (
      response.type !== "chatgpt" ||
      typeof response.loginId !== "string" ||
      typeof response.authUrl !== "string"
    ) {
      throw new Error("Codex app-server did not return a ChatGPT OAuth URL");
    }

    return {
      type: "chatgpt",
      loginId: response.loginId,
      authUrl: response.authUrl,
    };
  }

  async startInstrumentThread(projectRoot: string): Promise<string> {
    const response = (await this.request("thread/start", {
      cwd: projectRoot,
      runtimeWorkspaceRoots: [projectRoot],
      approvalPolicy: "on-request",
      permissions: ":workspace",
      serviceName: "canwesynth",
      developerInstructions:
        "Work only on CanWeSynth instruments and repository files requested by the user. Use the CanWeSynth MCP tools for instrument edits, preserve revisions, validate after every mutation, and never bypass approval prompts.",
      ephemeral: false,
    })) as JsonObject;
    const thread = response.thread as JsonObject | undefined;
    if (!thread || typeof thread.id !== "string") {
      throw new Error("Codex app-server returned an invalid thread");
    }
    return thread.id;
  }

  async prompt(
    threadId: string,
    text: string,
    projectRoot: string,
  ): Promise<string> {
    const response = (await this.request("turn/start", {
      threadId,
      cwd: projectRoot,
      runtimeWorkspaceRoots: [projectRoot],
      input: [{ type: "text", text, text_elements: [] }],
    })) as JsonObject;
    const turn = response.turn as JsonObject | undefined;
    if (!turn || typeof turn.id !== "string") {
      throw new Error("Codex app-server returned an invalid turn");
    }
    return turn.id;
  }

  private send(message: JsonObject): void {
    if (!this.process) {
      throw new Error("Codex app-server is not running");
    }
    this.process.stdin.write(`${JSON.stringify(message)}\n`);
  }

  private receive(line: string): void {
    let message: JsonObject;
    try {
      message = JSON.parse(line) as JsonObject;
    } catch {
      this.emit("protocolError", new Error("Received invalid JSON from app-server"));
      return;
    }

    const id = message.id;
    if (
      (typeof id === "string" || typeof id === "number") &&
      ("result" in message || "error" in message)
    ) {
      const pending = this.pending.get(id);
      if (!pending) return;
      this.pending.delete(id);
      if (message.error) {
        const error = message.error as JsonObject;
        pending.reject(
          new Error(
            typeof error.message === "string"
              ? error.message
              : "Unknown app-server error",
          ),
        );
      } else {
        pending.resolve(message.result);
      }
      return;
    }

    if (
      (typeof id === "string" || typeof id === "number") &&
      typeof message.method === "string"
    ) {
      const request: ApprovalRequest = {
        id,
        method: message.method,
        params: (message.params as JsonObject | undefined) ?? {},
        respond: (result) => this.send({ id, result }),
      };
      this.emit("serverRequest", request);
      return;
    }

    if (typeof message.method === "string") {
      this.emit("notification", message);
      this.emit(message.method, message.params);
    }
  }
}
