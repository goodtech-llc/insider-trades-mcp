# Insider Trades

Ask Claude about insider trading at US public companies — who bought or sold
their own company's shares, when, and for how much — straight from SEC Forms 3,
4 and 5, via the [Insider Trades API](https://www.insidertrades.us).

The plugin adds two tools and a skill:

- **Search filings** by company (ticker or CIK), insider, date range, transaction
  type, role (CEO, CFO, director, 10% owner) or dollar amount.
- **Analytics**: totals of buying and selling, a daily or monthly series, or the
  most active companies and insiders over a date range.
- **A skill** that teaches Claude how this data behaves: paging through results
  instead of reporting the first page as a total, which filters only work on
  recent filings, and how to spot dollar amounts that are known to be wrong.

## Setup

You need an Insider Trades API key. Free keys are available from your
[dashboard](https://www.insidertrades.us/dashboard/api); paid plans add history
and higher limits.

Claude Code asks for the key when you install the plugin and keeps it in your
system's secure credential store. To change it later, run
`/plugin configure insider-trades@goodtech`.

Requests go to the hosted server at `https://api.insidertrades.us/mcp` and count
toward your API plan. Nothing runs locally.

## Things to ask

- "What were the largest insider purchases last week?"
- "Which CEOs bought their own company's stock this month?"
- "Show me insider selling at Nvidia over the last 90 days."
- "Did several insiders at one company buy within the same week recently?"

## Notes

This is filing data, not investment advice. Free keys reach back one year; paid
keys reach back further.

Support: support@insidertrades.us · [Documentation](https://www.insidertrades.us/docs) ·
License: Apache-2.0
