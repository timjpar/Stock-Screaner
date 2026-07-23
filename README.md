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
3. Restart the dev server. The status dot under the filters turns green ("Live data").

The key is read only on the server (`src/lib/fmp.ts`) and never reaches the browser. `.env.local`
is gitignored, so your key is never committed.

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts: `npm run build` (production build), `npm run start` (serve the build),
`npm run lint`.

## How it's built

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** with a small design-token system in `src/app/globals.css`
- Type faces via `next/font`: Space Grotesk (display), IBM Plex Sans (body), IBM Plex Mono (data)
- Data layer: `src/lib/fmp.ts` (server-only FMP client, hourly-cached pool), `src/lib/screen.ts`
  (pure filter/sort logic shared by the UI), `src/lib/fallback.ts` (sample universe)
- API routes: `GET /api/screen` (the pool), `GET /api/stock/[symbol]` (company detail)

To stay well within the free API quota, the app pulls one broad pool of listings per hour and
does all filtering client-side, rather than hitting the API on every keystroke.

## Note

Screen is a research and education tool for filtering listings. It is **not investment advice**
and does not recommend buying or selling anything. Verify data before acting on it.
