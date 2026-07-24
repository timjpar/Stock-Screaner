# Screen — a stock screener

Filter the market by fundamentals — market cap, sector, valuation, dividend yield, beta,
and price — and narrow thousands of listings down to a shortlist. Built with Next.js and
live data from [Financial Modeling Prep](https://financialmodelingprep.com).

## What it does

- **Screen** a pool of large/mid-cap US listings against multiple filters at once. Filtering
  and sorting happen instantly in the browser, so adjusting a filter has no lag.
- **Universe counter** — a live readout of how many stocks pass your screen out of the pool,
  with a proportional "sieve" bar.
- **Sortable results table** with tabular figures; day change is the only place color appears
  (green up / red down), because that's the one number that carries a signal.
- **Company detail** for any ticker: price, key metrics, and profile. Use the ticker lookup
  in the header, or click any row.

## Getting live data

The app works out of the box on a bundled **sample** dataset. For live market data, add a free
FMP key:

1. Sign up at [financialmodelingprep.com](https://site.financialmodelingprep.com/developer/docs)
   and copy your API key from the dashboard (free tier: ~250 requests/day).
2. Open `.env.local` and set your key:
   ```
   FMP_API_KEY=your_key_here
   ```
3. Confirm the key works — this costs a few requests and reports which route family it reaches:
   ```bash
   npm run check-key
   ```
4. Restart the dev server. The status dot under the filters turns green ("Live data").

The key is read only on the server (`src/lib/fmp.ts`) and never reaches the browser. `.env.local`
is gitignored, so your key is never committed.

If live data doesn't come through, the banner at the top of the page names the reason — rejected
key, exhausted daily quota, or an endpoint the plan doesn't cover — and the app falls back to the
sample dataset rather than showing an empty screen.

### What the free tier actually allows

This shapes the whole data layer, so it's worth stating plainly. On a current free key:

| Endpoint | Status |
| --- | --- |
| `/api/v3/*` (all legacy routes) | ❌ Sunset for accounts created after 2025-08-31 |
| `/stable/company-screener` | ❌ 402 — paid plans only |
| `/stable/batch-quote`, multi-symbol `/stable/quote` | ❌ 402 — paid plans only |
| `/stable/profile?symbol=X` | ✅ One symbol per request, no symbol restrictions |
| `/stable/ratios-ttm?symbol=X` | ✅ One symbol per request, **limited to a subset of symbols** |

There is **no bulk endpoint**, so the pool can't be pulled in one query. Instead the client walks a
fixed universe (`UNIVERSE_SYMBOLS` in `src/lib/fallback.ts`, 66 large/mid caps) one symbol at a
time. `profile` supplies everything except P/E and EPS, which only `ratios-ttm` carries.

That makes the ~250 requests/day quota the binding constraint, and the cache windows are the budget:

```
profile     66 symbols ÷ 12h  = 132 req/day
ratios-ttm  34 symbols ÷ 24h  =  34 req/day
                                ───────────
                                166 req/day, leaving ~80 for detail-page views
```

Two consequences worth knowing:

- **Prices refresh twice a day, not intraday.** A deliberate trade to keep every column populated;
  market cap, P/E, yield and beta barely move on that timescale.
- **P/E and EPS cover ~34 of the 66 listings.** FMP gates fundamentals behind a per-symbol
  allowlist on the free tier — the other 32 return 402 from `ratios-ttm`, `income-statement` and
  `key-metrics-ttm` alike, so there's no free route to their P/E. Those stocks still screen on every
  other column and show `—` in the P/E column. Because an active P/E filter excludes stocks whose
  P/E is unknown, filtering by P/E narrows the pool to the covered subset; the banner says so.

Restricted symbols are remembered per process, so after the first build those 402s aren't re-spent.
Upgrading the FMP plan restores `company-screener` and batch quotes, at which point the one-symbol-
at-a-time walk can be replaced with the original single-request pool.

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts: `npm run build` (production build), `npm run start` (serve the build),
`npm run lint`, `npm run check-key` (verify the FMP key).

## How it's built

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** with a small design-token system in `src/app/globals.css`
- Type faces via `next/font`: Space Grotesk (display), IBM Plex Sans (body), IBM Plex Mono (data)
- Data layer: `src/lib/fmp.ts` (server-only FMP client, quota-budgeted caching), `src/lib/screen.ts`
  (pure filter/sort logic shared by the UI), `src/lib/fallback.ts` (sample universe + the live
  universe's symbol list)
- API routes: `GET /api/screen` (the pool), `GET /api/stock/[symbol]` (company detail)

All filtering and sorting happen client-side over a cached pool, so adjusting a filter costs no
API requests — see [What the free tier actually allows](#what-the-free-tier-actually-allows) for
the quota budget that shapes the fetch strategy.

If live data can't be served for any reason, the app falls back to the bundled sample universe and
says why in a banner, rather than showing an empty screen.

## Note

Screen is a research and education tool for filtering listings. It is **not investment advice**
and does not recommend buying or selling anything. Verify data before acting on it.
