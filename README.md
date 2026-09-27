# Insider Trades MCP Server

Official [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for the [Insider Trades API](https://insidertrades.us) — gives AI assistants real-time access to SEC Form 3, 4, and 5 insider transaction data.

Works with any MCP-compatible AI tool: **Claude Desktop**, **Cursor**, **Windsurf**, **VS Code Copilot**, **ChatGPT Desktop**, **Cline**, **Continue**, and more.

## Prerequisites

- Node.js 20 or later
- An Insider Trades API key — get one free at [insidertrades.us](https://insidertrades.us)

## Setup

Add the server to your AI tool's MCP config. The `npx` command downloads and runs the server automatically — no separate install needed.

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "insider-trades": {
      "command": "npx",
      "args": ["-y", "insider-trades-mcp"],
      "env": {
        "INSIDER_TRADES_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

Restart Claude Desktop. You should see the insider-trades tools available in the tools panel.

### Claude Code

Add the hosted server directly — no local install:

```shell
claude mcp add --transport http insider-trades https://api.insidertrades.us/mcp \
  --header "x-api-key: YOUR_API_KEY"
```

Or run this package locally, the same way as Claude Desktop:

```shell
claude mcp add insider-trades --env INSIDER_TRADES_API_KEY=YOUR_API_KEY -- npx -y insider-trades-mcp
```

### Cursor / Windsurf / Other MCP Clients

Add the same block under your tool's MCP server configuration. The format is identical across all MCP-compatible clients.

### Environment variable alternative

Instead of putting the key in the config file, you can export it in your shell profile and omit the `env` block:

```bash
export INSIDER_TRADES_API_KEY=your-api-key-here
```

---

## What the AI can do

Once configured, your AI assistant can answer questions like:

- *"Show me recent insider purchases at Apple"*
- *"Which CEOs bought their own company's stock this month?"*
- *"Which companies had the most insider buying last week?"*
- *"How much did insiders sell at Nvidia this quarter, in total?"*
- *"What have directors at Microsoft been buying or selling this year?"*
- *"Show me the latest Form 4 filings for Tesla"*

The AI handles filtering, pagination, and interpretation — you just ask in plain English.

---

## How it works

This package is a small local bridge to the hosted Insider Trades MCP server at
`https://api.insidertrades.us/mcp`. Your AI tool launches it with `npx`, and it
forwards each request, with your API key, to the hosted server. The tools, their
descriptions and the guidance the assistant receives all come from there, so you
get improvements without updating the package.

If your AI tool supports remote MCP servers, you can skip this package and add
the hosted URL directly, with your key as an `x-api-key` header.

Requests count against your API plan exactly as direct API calls do.

---

## Tool reference

### `search_insider_transactions`

Search individual SEC Form 3/4/5 filings. Each result is one filing, summarised:
who, which company, buy or sell, how much, and the filing id. All parameters are
optional.

| Parameter | Type | Description |
|---|---|---|
| `issuerTicker` | string | Company ticker, e.g. `"AAPL"` |
| `issuerCik` | string | Company CIK (numeric) |
| `reportingOwnerCik` | string | Insider CIK. There is no name search — find the CIK first |
| `filingId` | string | Fetch one filing by its id |
| `filingDateInEstStartDate` / `filingDateInEstEndDate` | string | Filing date range, `YYYY-MM-DD` (US Eastern) |
| `periodOfReportStartDate` / `periodOfReportEndDate` | string | Transaction date range, `YYYY-MM-DD` |
| `transactionTypes` | string | `"purchase"`, `"sale"`, `"grant"`, `"gift"`, `"exercise"`, and more. One type per call is always safe |
| `ownerRoles` | string | `"director"`, `"officer"`, `"tenPercentOwner"` |
| `officerTitles` | string | `"CEO"`, `"CFO"`, `"COO"`, etc. |
| `formTypes` | string | `"3"`, `"4"`, `"5"` (default: all) |
| `minTotalAmount` / `maxTotalAmount` | number | Dollar value range |
| `limit` | number | Rows per page, 1–100 (default 25) |
| `cursor` | string | `nextCursor` from a previous call, with the same filters |
| `detail` | `"summary"` \| `"full"` | `"full"` adds every transaction leg, footnotes and SEC links — use it for one filing |

### `insider_trading_analytics`

Totals, time series and rankings over a date range, aggregated server-side —
the right tool for "how much" and "who bought most".

| Parameter | Type | Description |
|---|---|---|
| `filingDateInEstStartDate` / `filingDateInEstEndDate` | string | Date range, `YYYY-MM-DD`. Required |
| `issuerCik` | string | Restrict to one company |
| `transactionType` | string | `"purchase"` or `"sale"` |
| `top` | `"issuers"` \| `"insiders"` | Rank the most active companies or insiders |
| `groupBy` / `granularity` | `"date"` / `"daily"` \| `"monthly"` | Return a time series |
| `limit` | number | How many ranked rows (with `top`), default 10 |

### Things worth knowing about the data

- **Results are paged.** When a result says `hasMore`, there are more filings;
  the assistant is told to page rather than present one page as a total.
- **Some dollar amounts are wrong at the source.** A known pipeline defect can
  inflate a filing's value by orders of magnitude. Those rows are flagged
  `amountSuspect`, and the assistant is told to quote their share counts instead.
- **Grants and option exercises are not buying.** They appear as `action: "other"`.
- **History depends on your plan:** free keys reach back one year, paid keys ten.

---

## Resources

- API docs: [insidertrades.us/docs](https://insidertrades.us/docs)
- Pricing: [insidertrades.us/pricing](https://insidertrades.us/pricing)
- Dashboard: [insidertrades.us/dashboard](https://insidertrades.us/dashboard)
- Node.js SDK: [insider-trades-api on npm](https://www.npmjs.com/package/insider-trades-api)
- Python SDK: [insider-trades-api on PyPI](https://pypi.org/project/insider-trades-api/)

---

Licensed under the [Apache 2.0 License](./LICENSE). Copyright 2026 GoodTech LLC.
