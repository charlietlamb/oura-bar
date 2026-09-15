import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { type Effect, Layer, Logger, ManagedRuntime } from "effect";
import { AppLive } from "../layers/live";
import { collection, definitions, status, today } from "../mcp/tools";

const stderrLogger = Logger.replace(
  Logger.defaultLogger,
  Logger.prettyLogger({ stderr: true })
);

const runtime = ManagedRuntime.make(Layer.merge(AppLive, stderrLogger));

type AppContext = Layer.Layer.Success<typeof AppLive>;

const describe = (error: unknown) =>
  typeof error === "object" && error !== null && "message" in error
    ? String(error.message)
    : String(error);

const run = <A, E>(effect: Effect.Effect<A, E, AppContext>) =>
  runtime.runPromise(effect).then(
    (value) => ({
      content: [
        { type: "text" as const, text: JSON.stringify(value, null, 2) },
      ],
    }),
    (error: unknown) => ({
      content: [{ type: "text" as const, text: describe(error) }],
      isError: true,
    })
  );

const createServer = () => {
  const server = new McpServer(
    { name: "oura", version: "0.1.0" },
    {
      instructions:
        "Reads the user's Oura Ring data through their own OAuth app. Scores are 0-100. Durations are seconds. Days are YYYY-MM-DD in the user's local zone.",
    }
  );

  server.registerTool(
    "oura_today",
    {
      title: "Oura today",
      description:
        "Latest readiness, sleep, and activity scores with contributors, last night's sleep stages and vitals, SpO2, stress, and resilience.",
      inputSchema: definitions.today,
    },
    () => run(today)
  );

  server.registerTool(
    "oura_collection",
    {
      title: "Oura collection",
      description:
        "Raw records from one Oura collection for a date range. Use daily_* for scores by day, sleep for per-night detail.",
      inputSchema: definitions.collection,
    },
    (input) => run(collection(input))
  );

  server.registerTool(
    "oura_status",
    {
      title: "Oura connection status",
      description:
        "Whether the user is authenticated with Oura and when the access token expires. Never returns tokens.",
      inputSchema: definitions.status,
    },
    () => run(status)
  );

  return server;
};

serveStdio(createServer, {
  onerror: (error) => {
    process.stderr.write(`${describe(error)}\n`);
  },
});
