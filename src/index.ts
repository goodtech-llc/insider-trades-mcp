import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { InsiderTradesAPI } from "insider-trades-api";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

// ---------------------------------------------------------------------------
// Input schema
// ---------------------------------------------------------------------------

const SearchInsiderTransactionsSchema = z.object({
  filingId: z.string().optional().describe(
    "Direct lookup by filing ID. Returns a single filing if found.",
  ),
  issuerTicker: z.string().optional().describe(
    'Filter by company ticker symbol, e.g. "AAPL", "MSFT", "TSLA".',
  ),
  issuerCik: z.string().optional().describe(
    "Filter by issuer CIK (numeric string). Use instead of ticker when you have the CIK.",
  ),
  reportingOwnerCik: z.string().optional().describe(
    "Filter by reporting owner (insider) CIK.",
  ),
  accessionNumber: z.string().optional().describe(
    'Filter by SEC accession number, e.g. "0001140361-26-023363".',
  ),
  formTypes: z.union([z.string(), z.array(z.string())]).optional().describe(
    '"3" = initial ownership statement, "4" = changes in ownership, "5" = annual statement. Defaults to all three.',
  ),
  transactionTypes: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .describe(
      'Filter by transaction type(s). Values: "purchase", "sale", "grant", "gift", "exercise", "derivativeExercise", "disposition", "discretionary", "derivativeConversion", "derivativeExpiration", "smallAcquisition", "inheritance", "equitySwap", "tender", "other".',
    ),
  ownerRoles: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .describe(
      'Filter by insider role(s). Values: "director", "officer", "tenPercentOwner".',
    ),
  officerTitles: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .describe(
      'Filter by normalized officer title(s), e.g. "CEO", "CFO", "COO", "President", "General Counsel".',
    ),
  filingDateInEstStartDate: z.string().optional().describe(
    "Filing date range start (YYYY-MM-DD, Eastern Time). Filters by the date the form was filed with the SEC.",
  ),
  filingDateInEstEndDate: z.string().optional().describe(
    "Filing date range end (YYYY-MM-DD, Eastern Time).",
  ),
  periodOfReportStartDate: z.string().optional().describe(
    "Period-of-report range start (YYYY-MM-DD). Filters by the date the transaction actually occurred, not the filing date.",
  ),
  periodOfReportEndDate: z.string().optional().describe(
    "Period-of-report range end (YYYY-MM-DD).",
  ),
  minTotalAmount: z.number().optional().describe(
    "Minimum total transaction dollar amount. Use to filter for significant trades.",
  ),
  maxTotalAmount: z.number().optional().describe(
    "Maximum total transaction dollar amount.",
  ),
  fieldset: z.enum(["minimal", "standard", "full"]).optional().describe(
    '"minimal": ID, issuer, owner, key amounts, dates. "standard": all aggregates + boolean flags + links + AI summary (recommended for most use cases). "full": standard + raw transaction arrays and holdings detail. Default: all stored fields.',
  ),
  limit: z
    .number()
    .int()
    .min(1)
    .max(750)
    .optional()
    .describe(
      "Results per page (default 100, max 750). Use a large value when iterating many pages to minimize request count.",
    ),
  cursor: z.string().optional().describe(
    "Opaque pagination cursor. Pass the nextCursor value from a previous response (with identical filters) to fetch the next page.",
  ),
});

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const server = new Server(
  { name: "insider-trades-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

let client: InsiderTradesAPI | null = null;

function getClient(): InsiderTradesAPI {
  if (!client) {
    client = new InsiderTradesAPI();
  }
  return client;
}

// ---------------------------------------------------------------------------
// Tool list
// ---------------------------------------------------------------------------

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "search_insider_transactions",
      description:
        "Search and filter SEC insider transactions from Form 3, 4, and 5 filings. " +
        "Use this to find insider buying/selling activity for a company (by ticker or CIK), " +
        "a specific insider (by CIK), filing date ranges, transaction types (purchases, sales, grants), " +
        "insider roles (director, officer, 10% owner), officer titles (CEO, CFO, etc.), and dollar amount thresholds. " +
        "Each result includes issuer info, insider info, dollar and share aggregates, boolean transaction flags, " +
        "10b5-1 plan indicator, late-filing flag, and an AI-generated plain-English summary. " +
        "When the response hasMore is true, call again with the nextCursor value to retrieve the next page.",
      inputSchema: zodToJsonSchema(SearchInsiderTransactionsSchema, {
        $refStrategy: "none",
      }),
    },
  ],
}));

// ---------------------------------------------------------------------------
// Tool handler
// ---------------------------------------------------------------------------

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "search_insider_transactions") {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }

  const params = SearchInsiderTransactionsSchema.parse(
    request.params.arguments ?? {},
  );

  const result = await getClient().getInsiderTransactions(params);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const transport = new StdioServerTransport();
await server.connect(transport);
