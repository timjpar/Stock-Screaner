import "server-only";
import type { DataSource, Stock, StockDetail } from "./types";
import { SAMPLE_UNIVERSE } from "./fallback";

/*
  Server-only Financial Modeling Prep client. The API key never leaves the server —
  the browser only ever talks to our own /api routes.

  Strategy for the free tier (~250 req/day): pull a broad pool of large-cap listings
  ONCE and cache it, then let the browser filter/sort that pool locally. This keeps
  screening instant and API usage tiny. FMP's screener carries sector/beta/dividend but
  not P/E or day change, so we enrich the pool with a batch quote call for those.
*/

const BASE = "https://financialmodelingprep.com/api/v3";
const KEY = process.env.FMP_API_KEY?.trim();

/** Pool size and freshness. Hourly refresh keeps well under the free daily quota. */
const POOL_LIMIT = 250;
const MARKET_CAP_FLOOR = 2_000_000_000; // $2B — keeps the pool to liquid large/mid caps.
const POOL_REVALIDATE = 3600;
const DETAIL_REVALIDATE = 1800;

export function hasKey(): boolean {
  return Boolean(KEY);
}

function n(v: unknown): number | null {
  const x = typeof v === "string" ? parseFloat(v) : (v as number);
  return typeof x === "number" && Number.isFinite(x) ? x : null;
}

async function fmp<T>(path: string, revalidate: number): Promise<T> {
  const sep = path.includes("?") ? "&" : "?";
  const url = `${BASE}${path}${sep}apikey=${KEY}`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(9000),
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`FMP ${path.split("?")[0]} → ${res.status}`);
  const json = (await res.json()) as T;
  if (json && typeof json === "object" && "Error Message" in (json as object)) {
    throw new Error(String((json as Record<string, unknown>)["Error Message"]));
  }
  return json;
}

type ScreenerRow = {
  symbol: string;
  companyName?: string;
  marketCap?: number;
  sector?: string;
  industry?: string;
  beta?: number;
  price?: number;
  lastAnnualDividend?: number;
  volume?: number;
  exchangeShortName?: string;
};

type QuoteRow = {
  symbol: string;
  price?: number;
  change?: number;
  changesPercentage?: number;
  marketCap?: number;
  pe?: number;
  eps?: number;
  volume?: number;
  name?: string;
};

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
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
    const rows = await fmp<ScreenerRow[]>(
      `/stock-screener?marketCapMoreThan=${MARKET_CAP_FLOOR}&isActivelyTrading=true&isEtf=false&limit=${POOL_LIMIT}`,
      POOL_REVALIDATE,
    );
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error("empty screener response");
    }

    const symbols = rows.map((r) => r.symbol).filter(Boolean);
    const quotes = new Map<string, QuoteRow>();
    for (const group of chunk(symbols, 100)) {
      const qs = await fmp<QuoteRow[]>(`/quote/${group.join(",")}`, POOL_REVALIDATE);
      for (const q of qs) quotes.set(q.symbol, q);
    }

    const results: Stock[] = rows.map((r) => {
      const q = quotes.get(r.symbol);
      const price = n(q?.price) ?? n(r.price);
      const dividend = n(r.lastAnnualDividend) ?? 0;
      return {
        symbol: r.symbol,
        name: r.companyName ?? q?.name ?? r.symbol,
        price,
        change: n(q?.change),
        changePercent: n(q?.changesPercentage),
        marketCap: n(q?.marketCap) ?? n(r.marketCap),
        pe: n(q?.pe),
        eps: n(q?.eps),
        beta: n(r.beta),
        dividend,
        dividendYield: dividend > 0 && price ? +((dividend / price) * 100).toFixed(2) : 0,
        volume: n(q?.volume) ?? n(r.volume),
        sector: r.sector ?? null,
        industry: r.industry ?? null,
        exchange: r.exchangeShortName ?? null,
      };
    });

    return { results, source: "live" };
  } catch (err) {
    return {
      results: SAMPLE_UNIVERSE,
      source: "sample",
      notice: `Live data unavailable (${
        err instanceof Error ? err.message : "unknown error"
      }). Showing sample data.`,
    };
  }
}

type ProfileRow = {
  symbol: string;
  companyName?: string;
  price?: number;
  changes?: number;
  mktCap?: number;
  beta?: number;
  lastDiv?: number;
  volAvg?: number;
  sector?: string;
  industry?: string;
  exchangeShortName?: string;
  description?: string;
  ceo?: string;
  website?: string;
  fullTimeEmployees?: string;
  country?: string;
  ipoDate?: string;
  range?: string;
};

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
    const [profiles, quotes] = await Promise.all([
      fmp<ProfileRow[]>(`/profile/${symbol}`, DETAIL_REVALIDATE),
      fmp<QuoteRow[]>(`/quote/${symbol}`, DETAIL_REVALIDATE),
    ]);
    const p = profiles?.[0];
    const q = quotes?.[0];
    if (!p && !q) return detailFromSample(symbol);

    const price = n(q?.price) ?? n(p?.price);
    const dividend = n(p?.lastDiv) ?? 0;
    const stock: Stock = {
      symbol: symbol.toUpperCase(),
      name: p?.companyName ?? q?.name ?? symbol.toUpperCase(),
      price,
      change: n(q?.change) ?? n(p?.changes),
      changePercent: n(q?.changesPercentage),
      marketCap: n(q?.marketCap) ?? n(p?.mktCap),
      pe: n(q?.pe),
      eps: n(q?.eps),
      beta: n(p?.beta),
      dividend,
      dividendYield: dividend > 0 && price ? +((dividend / price) * 100).toFixed(2) : 0,
      volume: n(q?.volume) ?? n(p?.volAvg),
      sector: p?.sector ?? null,
      industry: p?.industry ?? null,
      exchange: p?.exchangeShortName ?? null,
    };

    return {
      stock,
      description: p?.description ?? null,
      ceo: p?.ceo ?? null,
      website: p?.website ?? null,
      employees: p?.fullTimeEmployees ? n(p.fullTimeEmployees) : null,
      country: p?.country ?? null,
      ipoDate: p?.ipoDate ?? null,
      range52: p?.range ?? null,
      source: "live",
    };
  } catch {
    return detailFromSample(symbol);
  }
}
