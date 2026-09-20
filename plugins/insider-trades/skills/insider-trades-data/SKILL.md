---
name: insider-trades-data
description: How to query SEC insider-trading data correctly with the insider-trades tools — which filters exist, how to page, and the four ways a query returns a confident wrong answer. Use whenever answering questions about insider buying or selling, Form 4 filings, or what a company's executives and directors are doing with their own shares.
---

# Working with insider-trading data

Two tools: `search_insider_transactions` (individual filings) and
`insider_trading_analytics` (totals, time series, rankings). Reach for analytics
whenever the question is "how much", "which companies" or "who bought most" —
it aggregates server-side, where paging through filings would be slow and easy
to get wrong.

## Get the entity right first

- A company is identified by **ticker** (`issuerTicker`) or **CIK**; an insider
  only by **CIK**. There is no name search: "find Elon Musk's trades" has to
  start by finding his CIK, usually from a filing at a company he is known to
  file for.
- CIKs are numeric and may arrive zero-padded. Either form works as a filter.

## The four ways to get a confident wrong answer

**1. Treating the first page as the whole answer.** A response carries
`hasMore` and `nextCursor`. If `hasMore` is true, there are more filings that
match, and any total computed from that page is wrong. Page with the cursor and
the same filters, or use the analytics tool instead. Never say "there were 25
buys" when 25 is the page size.

**2. Combining several transaction types with a company and a filing-date
range.** `transactionTypes` accepts a comma-separated list, and it works on its
own — but a list *plus* an issuer or insider *plus* a `filingDateInEst` range
fails upstream and comes back with no rows, which reads like "no such trades".
One type per call is always safe. (A `periodOfReport` range is unaffected.)

**3. Using the type filter on older data.** It misses filings from before about
mid-2025, because older records lack the classification it reads. For history,
leave `transactionTypes` unset and separate buys from sales yourself using the
`action` field on each row.

**4. Repeating an impossible dollar amount.** A pipeline defect can multiply a
share count by a misread price, so an officer at a small company appears to have
bought billions of dollars of stock. Rows like that come back flagged
`amountSuspect`, and the result carries a warning. Quote the share count for
those, and say the dollar value looks wrong; do not include them in totals.

## What the data does and does not cover

- **History depends on the plan.** Free keys reach back one year, paid keys ten.
  Ask for a date range beyond it and the tools say so plainly, naming the
  earliest date allowed — that is a plan limit, not an absence of trades.
- **Dates:** `filed` is when the filing reached the SEC, `traded` is when the
  trade happened. They differ, often by days. Filters exist for both
  (`filingDateInEst*` and `periodOfReport*`); say which one an answer is about.
- **Not every row is a purchase or a sale.** Grants, option exercises and shares
  withheld for tax are filed on the same forms and show as `action: "other"`.
  Counting them as buying is the most common way to overstate insider buying.
- **`scheduled10b51: true`** means the trade came from a plan set up in advance.
  Those carry far less signal than a discretionary trade — worth mentioning when
  a large sale turns out to be pre-scheduled.

## Reading the result

Each row is one filing, summarised: who, at which company, which direction, how
much, and the filing id. Pass `detail: "full"` for a single filing when you need
every transaction leg, footnotes and the SEC links — it is much larger, so do
not use it for a list.

## Answering well

- Say what the window was and whether more matched than you read.
- Prefer share counts when a dollar amount is flagged.
- Distinguish open-market buying from grants and exercises.
- This is filing data, not investment advice. Describing what insiders did is
  useful and honest; recommending a trade off the back of it is neither.
