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

In Claude Code:

```shell
/plugin install insider-trades --marketplace goodtech-llc/insider-trades-mcp
```

Nothing to configure. The first time Claude uses a tool, it asks you to sign in
to Insider Trades (the same account as the website and app; creating one takes a
minute). A free plan is set up for you automatically: 1,000 requests a month
and the last 12 months of filings. Pro raises that to 100,000 requests and full
history; Claude tells you when you are getting close to the limit, with a link.

In Claude Code, if the sign-in window does not open by itself, run `/mcp`,
choose the Insider Trades server and pick **Authenticate**.

Requests go to the hosted server at `https://api.insidertrades.us/mcp` and count
toward your plan. Nothing runs locally.

**Prefer an API key?** Add the server yourself instead of using the plugin:
`claude mcp add --transport http insider-trades https://api.insidertrades.us/mcp --header "x-api-key: YOUR_KEY"`
(keys at your [dashboard](https://www.insidertrades.us/dashboard/api)).

## Things to ask

- "What were the largest insider purchases last week?"
- "Which CEOs bought their own company's stock this month?"
- "Show me insider selling at Nvidia over the last 90 days."
- "Did several insiders at one company buy within the same week recently?"

## Notes

This is filing data, not investment advice. The free plan reaches back one year;
Pro reaches back further.

Support: support@insidertrades.us · [Documentation](https://www.insidertrades.us/docs) ·
License: Apache-2.0
