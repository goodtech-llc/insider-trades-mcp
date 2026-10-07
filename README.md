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

### Claude Code — one command

Claude Code can install this as a plugin, which adds the server *and* a skill
that tells Claude how the data behaves (paging, filters that only work on recent
filings, and the dollar amounts that are known to be wrong):

```shell
/plugin marketplace add goodtech-llc/insider-trades-mcp
/plugin install insider-trades@goodtech
```

The install asks for your API key and keeps it in your system's secure
credential store, not in a settings file. To change it later, run `/plugin`,
open Insider Trades on the **Installed** tab and choose **Configure**.

The plugin points at the hosted server at `https://api.insidertrades.us/mcp`, so
there is nothing to install locally. If a tool call says the key is missing or
was rejected, do that and paste the key again in full, then start a
new session.

You can also add the hosted server directly, without the plugin or its skill:

```shell
claude mcp add --transport http insider-trades https://api.insidertrades.us/mcp \
  --header "x-api-key: $INSIDER_TRADES_API_KEY"
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
- *"Find all insider transactions over $1 million at Tesla in the last 90 days"*
- *"What have directors at Microsoft been buying or selling this year?"*
- *"Show me the latest Form 4 filings for Nvidia"*
- *"Which insiders filed late transactions this week?"*

The AI handles filtering, pagination, and interpretation — you just ask in plain English.

---

## Tool reference

### `search_insider_transactions`

Search and filter SEC insider transactions. All parameters are optional.

| Parameter | Type | Description |
|---|---|---|
| `issuerTicker` | string | Company ticker, e.g. `"AAPL"` |
| `issuerCik` | string | Issuer CIK (numeric) |
| `reportingOwnerCik` | string | Insider CIK |
| `filingId` | string | Direct lookup by filing ID |
| `accessionNumber` | string | SEC accession number |
| `formTypes` | string \| string[] | `"3"`, `"4"`, `"5"` (default: all) |
| `transactionTypes` | string \| string[] | `"purchase"`, `"sale"`, `"grant"`, `"gift"`, `"exercise"`, and more |
| `ownerRoles` | string \| string[] | `"director"`, `"officer"`, `"tenPercentOwner"` |
| `officerTitles` | string \| string[] | `"CEO"`, `"CFO"`, `"COO"`, etc. |
| `filingDateInEstStartDate` | string | Filing date start `YYYY-MM-DD` (Eastern Time) |
| `filingDateInEstEndDate` | string | Filing date end `YYYY-MM-DD` |
| `periodOfReportStartDate` | string | Transaction date start `YYYY-MM-DD` |
| `periodOfReportEndDate` | string | Transaction date end `YYYY-MM-DD` |
| `minTotalAmount` | number | Minimum transaction dollar value |
| `maxTotalAmount` | number | Maximum transaction dollar value |
| `fieldset` | `"minimal"` \| `"standard"` \| `"full"` | Response size (see below) |
| `limit` | number | Results per page, default 100, max 750 |
| `cursor` | string | Pagination cursor from a previous response |

**Fieldsets:**

| Value | Fields included |
|---|---|
| `"minimal"` | ID, issuer, owner, key amounts, dates |
| `"standard"` | All of minimal + aggregates, boolean flags, links, AI summary |
| `"full"` | All of standard + raw transaction arrays and holdings |

---

## Resources

- API docs: [insidertrades.us/docs](https://insidertrades.us/docs)
- Pricing: [insidertrades.us/pricing](https://insidertrades.us/pricing)
- Dashboard: [insidertrades.us/dashboard](https://insidertrades.us/dashboard)
- Node.js SDK: [insider-trades-api on npm](https://www.npmjs.com/package/insider-trades-api)
- Python SDK: [insider-trades-api on PyPI](https://pypi.org/project/insider-trades-api/)

---

Licensed under the [Apache 2.0 License](./LICENSE). Copyright 2026 GoodTech LLC.
