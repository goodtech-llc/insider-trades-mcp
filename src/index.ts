/**
 * insider-trades-mcp — a local (stdio) bridge to the hosted Insider Trades MCP server.
 *
 * Up to 0.1.x this package carried its own copy of the tools: its own schema,
 * its own call to the API and its own output, which was the raw filings — about
 * a megabyte for one active company's first page. The hosted server at
 * https://api.insidertrades.us/mcp then gained an analytics tool, compact
 * results, paging hints and warnings about the data's known defects, and this
 * copy had none of them. Two implementations of one thing drift.
 *
 * So this is now a bridge: it speaks stdio to the local client (Claude
 * Desktop, Cursor, anything that launches `npx insider-trades-mcp`) and
 * forwards every request to the hosted server. Tools, descriptions and
 * instructions all come from there, so npm users get every improvement the
 * moment it ships, with no new release.
 *
 * The API key is read from INSIDER_TRADES_API_KEY, as before, and sent as the
 * `x-api-key` header — so usage counts against the caller's plan exactly as a
 * direct API call does.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  type CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";

const VERSION = "0.2.0";
const UPSTREAM_URL = process.env.INSIDER_TRADES_MCP_URL ?? "https://api.insidertrades.us/mcp";
const API_KEY = (process.env.INSIDER_TRADES_API_KEY ?? "").trim();
// Long enough for a paged search on a cold start upstream, short enough that a
// dead network reads as an error rather than a hang.
const UPSTREAM_TIMEOUT_MS = 30_000;

// Shown only if the hosted server cannot be reached at startup; normally its
// own instructions are passed through verbatim.
const FALLBACK_INSTRUCTIONS =
  "SEC Form 3/4/5 insider transactions. Results are paged: when a result says " +
  "hasMore, pass nextCursor back with the same filters. Rows flagged amountSuspect " +
  "have a known-bad dollar value; quote their share counts instead. This is filing " +
  "data, not investment advice.";

// ── Upstream connection ──────────────────────────────────────────────────────

let upstream: Client | null = null;
let connecting: Promise<Client> | null = null;

async function connectUpstream(): Promise<Client> {
  const client = new Client({ name: "insider-trades-mcp", version: VERSION });
  const transport = new StreamableHTTPClientTransport(new URL(UPSTREAM_URL), {
    requestInit: { headers: API_KEY ? { "x-api-key": API_KEY } : {} },
  });
  await client.connect(transport, { timeout: UPSTREAM_TIMEOUT_MS });
  return client;
}

/** One shared connection, opened on first use and reopened after a failure. */
function getUpstream(): Promise<Client> {
  if (upstream) return Promise.resolve(upstream);
  connecting ??= connectUpstream()
    .then((client) => (upstream = client))
    .finally(() => {
      connecting = null;
    });
  return connecting;
}

function dropUpstream(): void {
  const stale = upstream;
  upstream = null;
  void stale?.close().catch(() => undefined);
}

/**
 * Run a request against the hosted server, reconnecting once if it fails.
 * The server keeps no session state, so a fresh connection loses nothing —
 * and a laptop that slept or changed networks is the common cause of a
 * failure here.
 */
async function withUpstream<T>(run: (client: Client) => Promise<T>): Promise<T> {
  try {
    return await run(await getUpstream());
  } catch (err) {
    // The server answered, and the answer was no (an unknown tool, bad
    // arguments). Retrying would get the same answer; reporting it as
    // "unreachable" would be false.
    if (err instanceof McpError) throw err;
    dropUpstream();
    return run(await getUpstream());
  }
}

/**
 * The hosted server's refusal, re-thrown for our own client.
 *
 * Not as an McpError: its constructor prefixes the message with
 * "MCP error <code>: ", and the client receiving it adds that prefix again, so
 * a pass-through arrived as "MCP error -32602: MCP error -32602: Unknown tool".
 * The protocol layer sends `message`, `code` and `data` from whatever is
 * thrown, so a plain Error carrying the bare message and the original code
 * reaches the client exactly as the hosted server said it.
 */
function passThrough(err: McpError): Error {
  const message = err.message.replace(/^(MCP error -?\d+: )+/, "");
  return Object.assign(new Error(message), { code: err.code, data: err.data });
}

function unreachable(err: unknown): string {
  const detail = err instanceof Error ? err.message : String(err);
  return (
    `Could not reach the Insider Trades server at ${UPSTREAM_URL} (${detail}). ` +
    "Check the network connection and try again."
  );
}

// ── Local server ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // Take the hosted server's instructions if it answers now; start anyway if it
  // does not, so the client still sees a server rather than a failed launch.
  let instructions = FALLBACK_INSTRUCTIONS;
  try {
    instructions = (await getUpstream()).getInstructions() ?? FALLBACK_INSTRUCTIONS;
  } catch (err) {
    process.stderr.write(`insider-trades-mcp: ${unreachable(err)}\n`);
  }

  const server = new Server(
    { name: "insider-trades-mcp", version: VERSION },
    { capabilities: { tools: {} }, instructions },
  );

  server.setRequestHandler(ListToolsRequestSchema, async (request) => {
    try {
      return await withUpstream((client) => client.listTools(request.params, { timeout: UPSTREAM_TIMEOUT_MS }));
    } catch (err) {
      throw err instanceof McpError ? passThrough(err) : err;
    }
  });

  server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
    // Answered here rather than forwarded: the hosted server would say to add
    // an x-api-key header in the connector's settings, which is the fix for a
    // remote connector and the wrong one for someone running this package.
    if (!API_KEY) {
      return {
        content: [{
          type: "text",
          text: "No Insider Trades API key is set. Add INSIDER_TRADES_API_KEY to the \"env\" block of " +
            "this server in your MCP config, then restart the app. Free keys: https://insidertrades.us",
        }],
        isError: true,
      };
    }
    try {
      return (await withUpstream((client) =>
        client.callTool(
          { name: request.params.name, arguments: request.params.arguments ?? {} },
          undefined,
          { timeout: UPSTREAM_TIMEOUT_MS },
        ),
      )) as CallToolResult;
    } catch (err) {
      // The hosted server's own refusal passes through, prefixed once.
      if (err instanceof McpError) throw passThrough(err);
      // A network failure becomes a tool result the assistant can read out,
      // rather than a protocol error most clients show as "the server is broken".
      return { content: [{ type: "text", text: unreachable(err) }], isError: true };
    }
  });

  await server.connect(new StdioServerTransport());
}

await main();
