import "server-only";
import type { DataSource, Stock, StockDetail } from "./types";
import { SAMPLE_UNIVERSE, UNIVERSE_SYMBOLS } from "./fallback";

/*
  Server-only Financial Modeling Prep client. The API key never leaves the server —
  the browser only ever talks to our own /api routes.

  WHY THIS IS SHAPED THE WAY IT IS

  FMP's free tier has no bulk endpoint. `/stable/company-screener`, `/stable/batch-quote`,
  `/stable/stock-list` and multi-symbol `/stable/quote` all return 402 Restricted, and every
  legacy `/api/v3` route was sunset for accounts created after 2025-08-31. So the pool cannot
  be pulled in one request — it is assembled symbol by symbol over a fixed universe
  (`UNIVERSE_SYMBOLS`, 66 large/mid caps).

  That makes the daily request quota (~250 on the free tier) the binding constraint, and the
  revalidate windows below are the budget:

    profile     66 symbols ÷ 12h  = 132 requests/day  (price, cap, beta, sector, dividend, …)
    ratios-ttm  34 symbols ÷ 24h  =  34 requests/day  (P/E and EPS — not present on profile)
                                     ─────────────────
                                     166 requests/day, leaving ~80 for detail-page views

  Only 34 because the free tier gates fundamentals behind a per-symbol allowlist — see
  `restrictedFundamentals` below. The first build after a restart pays the full 66 to
  discover which those are.

  Prices therefore refresh twice a day rather than intraday. That is a deliberate trade for
  keeping every screener column populated; fundamentals (cap, P/E, yield, beta) barely move on
  that timescale. Widening the universe or shortening the windows will exceed the quota.
*/

const HOST = "https://financialmodelingprep.com";
const KEY = process.env.FMP_API_KEY?.trim();

/** Cache lifetimes, in seconds. See the quota budget above before changing these. */
const PROFILE_REVALIDATE = 43_200; // 12 hours
const RATIOS_REVALIDATE = 86_400; // 24 hours
const QUOTE_REVALIDATE = 1_800; // 30 minutes — detail pages only, for a fresher print.

/** Parallel in-flight requests. Keeps a cold pool build quick without tripping rate limits. */
const CONCURRENCY = 6;

/**
 * Symbols whose fundamentals the plan won't serve.
 *
 * The free tier gates `ratios-ttm` (and `income-statement`, `key-metrics-ttm`) behind a
 * per-symbol allowlist — roughly half of our universe returns 402 "Premium Query Parameter"
 * no matter how it's asked. `profile` has no such restriction, so those stocks still screen
 * on every other column; they just have no P/E or EPS available at any refresh.
 *
 * Remembering them turns a guaranteed-402 into a skipped request, which is ~32 requests per
 * day back in the budget. Process-local on purpose: if the plan is upgraded, a restart
 * re-checks rather than caching a stale restriction forever.
 */
const restrictedFundamentals = new Set<string>();

export function hasKey(): boolean {
  return Boolean(KEY);
}

const ROUTES = {
  profile: (symbol: string) => `/stable/profile?symbol=${encodeURIComponent(symbol)}`,
  ratios: (symbol: string) => `/stable/ratios-ttm?symbol=${encodeURIComponent(symbol)}`,
  quote: (symbol: string) => `/stable/quote?symbol=${encodeURIComponent(symbol)}`,
};

/**
 * Why a request failed. `auth` and `quota` are fatal for the whole pool — every remaining
 * symbol would fail the same way, so we stop rather than spend the rest of the quota finding out.
 */
type FailureKind = "auth" | "quota" | "plan" | "shape" | "network";

class FmpError extends Error {
  constructor(readonly kind: FailureKind, message: string) {
    super(message);
    this.name = "FmpError";
  }
}

function isFatal(err: unknown): boolean {
  return err instanceof FmpError && (err.kind === "auth" || err.kind === "quota");
}

function classify(status: number, body: string): FailureKind {
  const m = body.toLowerCase();
  if (status === 401 || m.includes("invalid api key")) return "auth";
  if (status === 429 || m.includes("limit reach") || m.includes("bandwidth")) return "quota";
  if (
    status === 402 ||
    status === 403 ||
    m.includes("restricted endpoint") ||
    m.includes("premium query parameter") ||
    m.includes("legacy endpoint") ||
    m.includes("special endpoint") ||
    m.includes("subscription")
  ) {
    return "plan";
  }
  return "network";
}

function shortMessage(body: string, status: number): string {
  try {
    const parsed = JSON.parse(body) as Record<string, unknown>;
    const msg = parsed["Error Message"];
    if (typeof msg === "string") return msg.split(".")[0];
  } catch {
    // Restricted-endpoint responses arrive as bare text, not JSON.
    const trimmed = body.trim();
    if (trimmed && !trimmed.startsWith("<")) return trimmed.split(".")[0].slice(0, 120);
  }
  return `HTTP ${status}`;
}

async function call<T>(path: string, revalidate: number): Promise<T> {
  const sep = path.includes("?") ? "&" : "?";
  const url = `${HOST}${path}${sep}apikey=${KEY}`;

  let res: Response;
  try {
    res = await fetch(url, {
      signal: AbortSignal.timeout(9000),
      // Next 16 caches neither route handlers nor fetch by default. Without an explicit
      // force-cache every page view would rebuild the pool and blow the daily quota.
      cache: "force-cache",
      next: { revalidate, tags: ["fmp"] },
    });
  } catch (err) {
    throw new FmpError("network", err instanceof Error ? err.message : "request failed");
  }

  const text = await res.text();
  if (!res.ok) throw new FmpError(classify(res.status, text), shortMessage(text, res.status));

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new FmpError(classify(res.status, text), shortMessage(text, res.status));
  }

  // FMP reports some failures as HTTP 200 with an error body.
  if (json && typeof json === "object" && !Array.isArray(json)) {
    const err = (json as Record<string, unknown>)["Error Message"];
    if (typeof err === "string") throw new FmpError(classify(res.status, err), err.split(".")[0]);
  }
  return json as T;
}

type Row = Record<string, unknown>;

function n(v: unknown): number | null {
  const x = typeof v === "string" ? parseFloat(v) : (v as number);
  return typeof x === "number" && Number.isFinite(x) ? x : null;
}

function num(row: Row | undefined, ...keys: string[]): number | null {
  if (!row) return null;
  for (const k of keys) {
    const v = n(row[k]);
    if (v !== null) return v;
  }
  return null;
}

function str(row: Row | undefined, ...keys: string[]): string | null {
  if (!row) return null;
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return null;
}

function yieldPct(dividend: number, price: number | null): number {
  return dividend > 0 && price ? +((dividend / price) * 100).toFixed(2) : 0;
}

/** Run `fn` over `items` with a fixed number of workers, preserving input order. */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (let i = next++; i < items.length; i = next++) {
      out[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return out;
}

/**
 * Build one screener row. `profile` carries everything except P/E and EPS, which only
 * `ratios-ttm` exposes on this tier — so a missing ratios row costs two columns, not the stock.
 */
function toStock(symbol: string, p: Row, r: Row | undefined): Stock {
  const price = num(p, "price");
  const dividend = num(p, "lastDividend", "lastAnnualDividend") ?? 0;
  return {
    symbol,
    name: str(p, "companyName") ?? symbol,
    price,
    change: num(p, "change"),
    changePercent: num(p, "changePercentage", "changesPercentage"),
    marketCap: num(p, "marketCap", "mktCap"),
    pe: num(r, "priceToEarningsRatioTTM"),
    eps: num(r, "netIncomePerShareTTM"),
    beta: num(p, "beta"),
    dividend,
    dividendYield: yieldPct(dividend, price),
    volume: num(p, "volume", "averageVolume", "volAvg"),
    sector: str(p, "sector"),
    industry: str(p, "industry"),
    exchange: str(p, "exchange", "exchangeShortName"),
  };
}

function noticeFor(err: unknown): string {
  const kind = err instanceof FmpError ? err.kind : "network";
  const detail = err instanceof Error ? err.message : "unknown error";
  switch (kind) {
    case "auth":
      return "Live data unavailable: FMP rejected the API key. Check FMP_API_KEY in .env.local and restart the dev server. Showing sample data.";
    case "quota":
      return "Live data unavailable: the FMP daily request limit was reached. It resets at midnight UTC. Showing sample data.";
    case "plan":
      return `Live data unavailable: this endpoint isn't included in the current FMP plan (${detail}). Showing sample data.`;
    default:
      return `Live data unavailable (${detail}). Showing sample data.`;
  }
}

/**
 * Explain any gaps in an otherwise-live pool, so a half-filled P/E column reads as a known
 * plan limit rather than a bug. Returns nothing when the data came back complete.
 */
function poolNotice(results: Stock[]): { notice: string } | undefined {
  const parts: string[] = [];

  const dropped = UNIVERSE_SYMBOLS.length - results.length;
  if (dropped > 0) parts.push(`${dropped} of ${UNIVERSE_SYMBOLS.length} listings were unavailable this refresh`);

  const noPe = results.filter((s) => s.pe == null).length;
  if (noPe > 0) {
    parts.push(
      `P/E and EPS cover ${results.length - noPe} of ${results.length} listings — FMP's free tier ` +
        `restricts fundamentals to a subset of symbols, so a P/E filter will exclude the rest`,
    );
  }

  return parts.length ? { notice: `Live data. ${parts.join(". ")}.` } : undefined;
}

/** Fetch the screenable pool: live from FMP when a key exists, else the sample universe. */
export async function getPool(): Promise<{ results: Stock[]; source: DataSource; notice?: string }> {
  if (!KEY) {
    return {
      results: SAMPLE_UNIVERSE,
      source: "sample",
      notice: "Showing sample data. Add a free FMP_API_KEY in .env.local for live market data.",
    };
  }

  try {
    const rows = await mapLimit(UNIVERSE_SYMBOLS, CONCURRENCY, async (symbol) => {
      const [profiles, ratios] = await Promise.all([
        call<Row[]>(ROUTES.profile(symbol), PROFILE_REVALIDATE),
        // P/E is a nice-to-have: a failure here must not cost us the whole row.
        restrictedFundamentals.has(symbol)
          ? Promise.resolve([] as Row[])
          : call<Row[]>(ROUTES.ratios(symbol), RATIOS_REVALIDATE).catch((err) => {
              if (isFatal(err)) throw err;
              if (err instanceof FmpError && err.kind === "plan") restrictedFundamentals.add(symbol);
              return [] as Row[];
            }),
      ]);
      const p = Array.isArray(profiles) ? profiles[0] : undefined;
      if (!p) return null;
      return toStock(symbol, p, Array.isArray(ratios) ? ratios[0] : undefined);
    });

    const results = rows.filter((s): s is Stock => s !== null);
    if (results.length === 0) throw new FmpError("shape", "no listings returned");

    return { results, source: "live", ...(poolNotice(results) ?? {}) };
  } catch (err) {
    return { results: SAMPLE_UNIVERSE, source: "sample", notice: noticeFor(err) };
  }
}

function detailFromSample(symbol: string): StockDetail | null {
  const s = SAMPLE_UNIVERSE.find((x) => x.symbol === symbol.toUpperCase());
  if (!s) return null;
  return {
    stock: s,
    description: `${s.name} is a ${s.sector ?? ""} company. This is sample data — add an FMP_API_KEY in .env.local to load the live company profile.`,
    ceo: null,
    website: null,
    employees: null,
    country: "US",
    ipoDate: null,
    range52: null,
    source: "sample",
  };
}

export async function getStockDetail(symbol: string): Promise<StockDetail | null> {
  if (!KEY) return detailFromSample(symbol);

  try {
    // The profile and ratios calls are usually already warm from the pool build; only the
    // quote is likely to cost a request, and it buys a much fresher price than the 12h profile.
    const [profiles, ratios, quotes] = await Promise.all([
      call<Row[]>(ROUTES.profile(symbol), PROFILE_REVALIDATE),
      call<Row[]>(ROUTES.ratios(symbol), RATIOS_REVALIDATE).catch(() => [] as Row[]),
      call<Row[]>(ROUTES.quote(symbol), QUOTE_REVALIDATE).catch(() => [] as Row[]),
    ]);

    const p = Array.isArray(profiles) ? profiles[0] : undefined;
    const r = Array.isArray(ratios) ? ratios[0] : undefined;
    const q = Array.isArray(quotes) ? quotes[0] : undefined;
    if (!p && !q) return detailFromSample(symbol);

    const base = toStock(symbol.toUpperCase(), p ?? {}, r);
    const stock: Stock = {
      ...base,
      // Prefer the quote's fresher print where it has one.
      price: num(q, "price") ?? base.price,
      change: num(q, "change") ?? base.change,
      changePercent: num(q, "changePercentage", "changesPercentage") ?? base.changePercent,
      marketCap: num(q, "marketCap") ?? base.marketCap,
      volume: num(q, "volume") ?? base.volume,
      name: base.name || (str(q, "name") ?? symbol.toUpperCase()),
      exchange: base.exchange ?? str(q, "exchange"),
    };
    stock.dividendYield = yieldPct(stock.dividend ?? 0, stock.price);

    const yearLow = num(q, "yearLow");
    const yearHigh = num(q, "yearHigh");

    return {
      stock,
      description: str(p, "description"),
      ceo: str(p, "ceo"),
      website: str(p, "website"),
      employees: num(p, "fullTimeEmployees"),
      country: str(p, "country"),
      ipoDate: str(p, "ipoDate"),
      range52: str(p, "range") ?? (yearLow !== null && yearHigh !== null ? `${yearLow}-${yearHigh}` : null),
      source: "live",
    };
  } catch {
    return detailFromSample(symbol);
  }
}
