/** A single screened equity, normalized across data sources. */
export type Stock = {
  symbol: string;
  name: string;
  price: number | null;
  /** Absolute price change on the day, in the listing currency. */
  change: number | null;
  /** Percent change on the day. */
  changePercent: number | null;
  marketCap: number | null;
  pe: number | null;
  eps: number | null;
  beta: number | null;
  /** Last annual dividend paid, per share. */
  dividend: number | null;
  /** Dividend yield as a percent (dividend / price * 100). */
  dividendYield: number | null;
  volume: number | null;
  sector: string | null;
  industry: string | null;
  exchange: string | null;
};

/** Filters a viewer can set. All optional; absent means "no constraint". */
export type Filters = {
  sector?: string;
  exchange?: string;
  marketCapMin?: number;
  marketCapMax?: number;
  priceMin?: number;
  priceMax?: number;
  peMax?: number;
  dividendYieldMin?: number;
  betaMax?: number;
  volumeMin?: number;
  limit?: number;
};

export type DataSource = "live" | "sample";

export type ScreenResponse = {
  results: Stock[];
  /** How many listings the underlying universe reported before the shortlist was capped. */
  universe: number;
  source: DataSource;
  /** Present when live data was requested but could not be served. */
  notice?: string;
};

export type StockDetail = {
  stock: Stock;
  description: string | null;
  ceo: string | null;
  website: string | null;
  employees: number | null;
  country: string | null;
  ipoDate: string | null;
  range52: string | null;
  source: DataSource;
};

export const SECTORS = [
  "Technology",
  "Financial Services",
  "Healthcare",
  "Consumer Cyclical",
  "Consumer Defensive",
  "Communication Services",
  "Industrials",
  "Energy",
  "Utilities",
  "Basic Materials",
  "Real Estate",
] as const;

export const EXCHANGES = ["NASDAQ", "NYSE", "AMEX"] as const;
