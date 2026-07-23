"use client";

import { useEffect, useMemo, useState } from "react";
import type { Filters, ScreenResponse, Stock } from "@/lib/types";
import type { SortDir, SortKey } from "@/lib/screen";
import { applyFilters, sortStocks } from "@/lib/screen";
import UniverseCounter from "./UniverseCounter";
import ScreenerFilters from "./ScreenerFilters";
import ResultsTable from "./ResultsTable";

const SORT_LABELS: Record<SortKey, string> = {
  symbol: "Symbol",
  name: "Company",
  price: "Price",
  changePercent: "Day change",
  marketCap: "Market cap",
  pe: "P/E ratio",
  dividendYield: "Dividend yield",
  beta: "Beta",
  volume: "Volume",
};

/** Text columns read most naturally A→Z; metrics read most naturally high→low. */
function defaultDir(key: SortKey): SortDir {
  return key === "symbol" || key === "name" ? "asc" : "desc";
}

export default function Screener() {
  const [pool, setPool] = useState<Stock[] | null>(null);
  const [source, setSource] = useState<"live" | "sample">("sample");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>({});
  const [sortKey, setSortKey] = useState<SortKey>("marketCap");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/screen")
      .then((r) => r.json() as Promise<ScreenResponse>)
      .then((data) => {
        if (cancelled) return;
        setPool(data.results);
        setSource(data.source);
        setNotice(data.notice ?? null);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load market data. Refresh to try again.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => (pool ? applyFilters(pool, filters) : []), [pool, filters]);
  const sorted = useMemo(() => sortStocks(filtered, sortKey, sortDir), [filtered, sortKey, sortDir]);

  const loading = pool === null && !error;

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(defaultDir(key));
    }
  }

  return (
    <>
      {notice && (
        <div className="border-b border-line bg-accent-soft/60">
          <div className="mx-auto w-full max-w-[1180px] px-5 py-2.5 sm:px-8">
            <p className="text-xs text-accent-ink">{notice}</p>
          </div>
        </div>
      )}

      <UniverseCounter
        matches={sorted.length}
        universe={pool?.length ?? 0}
        sortLabel={`${SORT_LABELS[sortKey]} ${sortDir === "asc" ? "↑" : "↓"}`}
        loading={loading}
      />

      <div className="mx-auto w-full max-w-[1180px] px-5 py-6 sm:px-8">
        {error ? (
          <div className="rounded-xl border border-down/30 bg-down-soft/50 p-8 text-center text-sm text-down">
            {error}
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-[290px_1fr] lg:gap-6">
            <div className="mb-4 lg:mb-0">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen((o) => !o)}
                className="control mb-3 flex w-full items-center justify-between font-[family-name:var(--font-sans)] font-medium lg:hidden"
                aria-expanded={mobileFiltersOpen}
              >
                <span>{mobileFiltersOpen ? "Hide filters" : "Show filters"}</span>
                <span aria-hidden>{mobileFiltersOpen ? "▲" : "▼"}</span>
              </button>

              <aside className={`${mobileFiltersOpen ? "block" : "hidden"} lg:block lg:sticky lg:top-4`}>
                <ScreenerFilters
                  filters={filters}
                  onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
                  onReset={() => setFilters({})}
                />
                <p className="mt-3 flex items-center gap-1.5 px-1 text-[0.625rem] text-ink-faint">
                  <span
                    className={`inline-block h-1.5 w-1.5 rounded-full ${
                      source === "live" ? "bg-up" : "bg-ink-faint"
                    }`}
                  />
                  {source === "live" ? "Live data · Financial Modeling Prep" : "Sample data"}
                </p>
              </aside>

              <div className="hidden lg:block" />
            </div>

            <ResultsTable
              stocks={sorted}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
              loading={loading}
            />
          </div>
        )}
      </div>
    </>
  );
}
