import Link from "next/link";
import type { Metadata } from "next";
import Masthead from "@/components/Masthead";
import SiteFooter from "@/components/SiteFooter";
import { getStockDetail } from "@/lib/fmp";
import { fmtCompact, fmtInt, fmtNum, fmtPct, fmtPrice } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ symbol: string }>;
}): Promise<Metadata> {
  const { symbol } = await params;
  return { title: `${symbol.toUpperCase()} — Screen` };
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface px-4 py-3">
      <div className="eyebrow">{label}</div>
      <div className="tnum mt-1 text-lg text-ink">{value}</div>
    </div>
  );
}

export default async function StockPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  const detail = await getStockDetail(symbol);

  return (
    <>
      <Masthead />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-[1180px] px-5 py-6 sm:px-8 sm:py-8">
          <Link
            href="/"
            className="eyebrow inline-flex items-center gap-1 text-ink-faint transition-colors hover:text-accent"
          >
            <span aria-hidden>←</span> Back to screen
          </Link>

          {!detail ? (
            <div className="mt-8 rounded-xl border border-line bg-surface p-12 text-center">
              <p className="font-[family-name:var(--font-display)] text-xl font-semibold text-ink">
                No data for {symbol.toUpperCase()}
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                Check the ticker symbol, or head back to the screen.
              </p>
            </div>
          ) : (
            (() => {
              const s = detail.stock;
              const up = (s.changePercent ?? 0) > 0;
              const down = (s.changePercent ?? 0) < 0;
              return (
                <>
                  <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h1 className="tnum font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-ink">
                          {s.symbol}
                        </h1>
                        {s.exchange && (
                          <span className="eyebrow rounded-full border border-line px-2 py-1">
                            {s.exchange}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-ink-soft">{s.name}</p>
                      {(s.sector || s.industry) && (
                        <p className="mt-0.5 text-xs text-ink-faint">
                          {[s.sector, s.industry].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="tnum font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">
                        {fmtPrice(s.price)}
                      </div>
                      <div
                        className={`tnum text-sm font-medium ${
                          up ? "text-up" : down ? "text-down" : "text-ink-faint"
                        }`}
                      >
                        {s.change != null ? fmtPrice(s.change).replace("$", up ? "+$" : down ? "−$" : "$").replace("-", "") : ""}{" "}
                        {fmtPct(s.changePercent)} today
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    <Metric label="Market cap" value={fmtCompact(s.marketCap)} />
                    <Metric label="P/E ratio" value={fmtNum(s.pe, 1)} />
                    <Metric label="EPS" value={fmtPrice(s.eps)} />
                    <Metric label="Beta" value={fmtNum(s.beta, 2)} />
                    <Metric label="Dividend / share" value={s.dividend ? fmtPrice(s.dividend) : "—"} />
                    <Metric label="Dividend yield" value={s.dividendYield ? `${fmtNum(s.dividendYield, 2)}%` : "—"} />
                    <Metric label="Volume" value={fmtCompact(s.volume)} />
                    {detail.range52 && <Metric label="52-week range" value={detail.range52} />}
                  </div>

                  {detail.description && (
                    <div className="mt-8 max-w-3xl">
                      <div className="eyebrow">About</div>
                      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{detail.description}</p>
                    </div>
                  )}

                  {(detail.ceo || detail.employees || detail.country || detail.ipoDate || detail.website) && (
                    <dl className="mt-6 grid max-w-3xl grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
                      {detail.ceo && (
                        <div>
                          <dt className="eyebrow">CEO</dt>
                          <dd className="mt-0.5 text-ink-soft">{detail.ceo}</dd>
                        </div>
                      )}
                      {detail.employees != null && (
                        <div>
                          <dt className="eyebrow">Employees</dt>
                          <dd className="tnum mt-0.5 text-ink-soft">{fmtInt(detail.employees)}</dd>
                        </div>
                      )}
                      {detail.country && (
                        <div>
                          <dt className="eyebrow">Country</dt>
                          <dd className="mt-0.5 text-ink-soft">{detail.country}</dd>
                        </div>
                      )}
                      {detail.ipoDate && (
                        <div>
                          <dt className="eyebrow">IPO date</dt>
                          <dd className="tnum mt-0.5 text-ink-soft">{detail.ipoDate}</dd>
                        </div>
                      )}
                      {detail.website && (
                        <div>
                          <dt className="eyebrow">Website</dt>
                          <dd className="mt-0.5 truncate">
                            <a
                              href={detail.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent hover:opacity-70"
                            >
                              {detail.website.replace(/^https?:\/\//, "")}
                            </a>
                          </dd>
                        </div>
                      )}
                    </dl>
                  )}

                  {detail.source === "sample" && (
                    <p className="mt-8 text-xs text-ink-faint">
                      Sample data. Add a free FMP_API_KEY in .env.local for the live company profile.
                    </p>
                  )}
                </>
              );
            })()
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
