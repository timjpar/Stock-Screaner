import type { Filters, Stock } from "./types";

/**
 * Pure filter + sort logic shared by the client UI. When a filter is active and a
 * stock has no value for that metric, it's excluded — we can't confirm it passes.
 */
export function applyFilters(stocks: Stock[], f: Filters): Stock[] {
  return stocks.filter((s) => {
    if (f.sector && s.sector !== f.sector) return false;
    if (f.exchange && s.exchange !== f.exchange) return false;

    if (f.marketCapMin != null && (s.marketCap == null || s.marketCap < f.marketCapMin)) return false;
    if (f.marketCapMax != null && (s.marketCap == null || s.marketCap > f.marketCapMax)) return false;

    if (f.priceMin != null && (s.price == null || s.price < f.priceMin)) return false;
    if (f.priceMax != null && (s.price == null || s.price > f.priceMax)) return false;

    if (f.peMax != null && (s.pe == null || s.pe > f.peMax)) return false;
    if (f.dividendYieldMin != null && (s.dividendYield == null || s.dividendYield < f.dividendYieldMin)) return false;
    if (f.betaMax != null && (s.beta == null || s.beta > f.betaMax)) return false;
    if (f.volumeMin != null && (s.volume == null || s.volume < f.volumeMin)) return false;

    return true;
  });
}

export type SortKey =
  | "symbol"
  | "name"
  | "price"
  | "changePercent"
  | "marketCap"
  | "pe"
  | "dividendYield"
  | "beta"
  | "volume";

export type SortDir = "asc" | "desc";

export function sortStocks(stocks: Stock[], key: SortKey, dir: SortDir): Stock[] {
  const sign = dir === "asc" ? 1 : -1;
  return [...stocks].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    // Nulls always sink to the bottom regardless of direction.
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === "string" && typeof bv === "string") {
      return sign * av.localeCompare(bv);
    }
    return sign * ((av as number) - (bv as number));
  });
}

export function activeFilterCount(f: Filters): number {
  return (Object.keys(f) as (keyof Filters)[]).filter(
    (k) => k !== "limit" && f[k] != null && f[k] !== "",
  ).length;
}
