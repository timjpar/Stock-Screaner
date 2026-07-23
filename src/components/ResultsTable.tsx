"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Stock } from "@/lib/types";
import type { SortDir, SortKey } from "@/lib/screen";
import { fmtCompact, fmtNum, fmtPct, fmtPrice } from "@/lib/format";

type Col = {
  key: SortKey;
  label: string;
  align: "left" | "right";
  render: (s: Stock) => React.ReactNode;
  className?: string;
};

const COLS: Col[] = [
  { key: "symbol", label: "Symbol", align: "left", render: (s) => s.symbol },
  { key: "name", label: "Company", align: "left", render: (s) => s.name },
  { key: "price", label: "Price", align: "right", render: (s) => fmtPrice(s.price) },
  { key: "changePercent", label: "Chg %", align: "right", render: (s) => fmtPct(s.changePercent) },
  { key: "marketCap", label: "Mkt cap", align: "right", render: (s) => fmtCompact(s.marketCap) },
  { key: "pe", label: "P/E", align: "right", render: (s) => fmtNum(s.pe, 1) },
  { key: "dividendYield", label: "Div %", align: "right", render: (s) => fmtNum(s.dividendYield, 2) },
  { key: "beta", label: "Beta", align: "right", render: (s) => fmtNum(s.beta, 2) },
  { key: "volume", label: "Vol", align: "right", render: (s) => fmtCompact(s.volume) },
];

function SortArrow({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span
      aria-hidden
      className={`ml-1 inline-block text-[0.625rem] transition-opacity ${
        active ? "text-accent opacity-100" : "opacity-0 group-hover:opacity-40"
      }`}
    >
      {active && dir === "asc" ? "▲" : "▼"}
    </span>
  );
}

type Props = {
  stocks: Stock[];
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  loading: boolean;
};

export default function ResultsTable({ stocks, sortKey, sortDir, onSort, loading }: Props) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="rounded-xl border border-line bg-surface p-12 text-center text-sm text-ink-faint">
        Loading the market…
      </div>
    );
  }

  if (stocks.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface p-12 text-center">
        <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-ink">
          Nothing passes this screen
        </p>
        <p className="mt-1 text-sm text-ink-soft">Loosen a filter to widen the net.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line">
            {COLS.map((col) => {
              const active = sortKey === col.key;
              return (
                <th
                  key={col.key}
                  scope="col"
                  className={`sticky top-0 z-10 bg-surface px-3 py-2.5 ${
                    col.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSort(col.key)}
                    className={`group eyebrow inline-flex items-center whitespace-nowrap transition-colors hover:text-ink ${
                      active ? "text-accent" : ""
                    } ${col.align === "right" ? "flex-row-reverse" : ""}`}
                    aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                  >
                    {col.label}
                    <SortArrow active={active} dir={sortDir} />
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {stocks.map((s) => {
            const up = (s.changePercent ?? 0) > 0;
            const down = (s.changePercent ?? 0) < 0;
            return (
              <tr
                key={s.symbol}
                onClick={() => router.push(`/stock/${s.symbol}`)}
                className="cursor-pointer border-b border-line/70 transition-colors last:border-0 hover:bg-sunk/60"
              >
                <td className="px-3 py-2.5 text-left">
                  <Link
                    href={`/stock/${s.symbol}`}
                    onClick={(e) => e.stopPropagation()}
                    className="tnum font-medium text-ink hover:text-accent"
                  >
                    {s.symbol}
                  </Link>
                </td>
                <td className="max-w-[220px] truncate px-3 py-2.5 text-left text-ink-soft">
                  {s.name}
                </td>
                <td className="tnum px-3 py-2.5 text-right text-ink">{fmtPrice(s.price)}</td>
                <td
                  className={`tnum px-3 py-2.5 text-right font-medium ${
                    up ? "text-up" : down ? "text-down" : "text-ink-faint"
                  }`}
                >
                  {fmtPct(s.changePercent)}
                </td>
                <td className="tnum px-3 py-2.5 text-right text-ink-soft">{fmtCompact(s.marketCap)}</td>
                <td className="tnum px-3 py-2.5 text-right text-ink-soft">{fmtNum(s.pe, 1)}</td>
                <td className="tnum px-3 py-2.5 text-right text-ink-soft">{fmtNum(s.dividendYield, 2)}</td>
                <td className="tnum px-3 py-2.5 text-right text-ink-soft">{fmtNum(s.beta, 2)}</td>
                <td className="tnum px-3 py-2.5 text-right text-ink-soft">{fmtCompact(s.volume)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
