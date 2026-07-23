"use client";

import type { Filters } from "@/lib/types";
import { SECTORS, EXCHANGES } from "@/lib/types";
import { activeFilterCount } from "@/lib/screen";

type Props = {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  onReset: () => void;
};

const MARKET_CAP_STEPS: { label: string; value: number }[] = [
  { label: "$2B", value: 2e9 },
  { label: "$10B", value: 1e10 },
  { label: "$50B", value: 5e10 },
  { label: "$100B", value: 1e11 },
  { label: "$500B", value: 5e11 },
  { label: "$1T", value: 1e12 },
];

const VOLUME_STEPS: { label: string; value: number }[] = [
  { label: "100K", value: 1e5 },
  { label: "500K", value: 5e5 },
  { label: "1M", value: 1e6 },
  { label: "5M", value: 5e6 },
  { label: "10M", value: 1e7 },
];

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between">
        <span className="eyebrow">{label}</span>
        {hint ? <span className="text-[0.625rem] text-ink-faint">{hint}</span> : null}
      </span>
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}

/** Parses a numeric input into a number or undefined (blank clears the filter). */
function parseNum(raw: string): number | undefined {
  if (raw.trim() === "") return undefined;
  const v = Number(raw);
  return Number.isFinite(v) ? v : undefined;
}

export default function ScreenerFilters({ filters, onChange, onReset }: Props) {
  const count = activeFilterCount(filters);

  return (
    <div className="rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold tracking-tight">
          Filters
          {count > 0 && (
            <span className="tnum ml-2 rounded-full bg-accent-soft px-1.5 py-0.5 text-[0.6875rem] font-medium text-accent-ink">
              {count}
            </span>
          )}
        </h2>
        <button
          type="button"
          onClick={onReset}
          disabled={count === 0}
          className="text-xs font-medium text-accent transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:text-ink-faint disabled:opacity-100"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-4 p-4">
        <div className="col-span-2">
          <Field label="Sector">
            <select
              className="control"
              value={filters.sector ?? ""}
              onChange={(e) => onChange({ sector: e.target.value || undefined })}
            >
              <option value="">All sectors</option>
              {SECTORS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Exchange">
          <select
            className="control"
            value={filters.exchange ?? ""}
            onChange={(e) => onChange({ exchange: e.target.value || undefined })}
          >
            <option value="">Any</option>
            {EXCHANGES.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Min volume">
          <select
            className="control"
            value={filters.volumeMin ?? ""}
            onChange={(e) => onChange({ volumeMin: e.target.value ? Number(e.target.value) : undefined })}
          >
            <option value="">Any</option>
            {VOLUME_STEPS.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Mkt cap min">
          <select
            className="control"
            value={filters.marketCapMin ?? ""}
            onChange={(e) => onChange({ marketCapMin: e.target.value ? Number(e.target.value) : undefined })}
          >
            <option value="">Any</option>
            {MARKET_CAP_STEPS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}+
              </option>
            ))}
          </select>
        </Field>

        <Field label="Mkt cap max">
          <select
            className="control"
            value={filters.marketCapMax ?? ""}
            onChange={(e) => onChange({ marketCapMax: e.target.value ? Number(e.target.value) : undefined })}
          >
            <option value="">Any</option>
            {MARKET_CAP_STEPS.map((m) => (
              <option key={m.value} value={m.value}>
                under {m.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Price min" hint="$">
          <input
            className="control"
            type="number"
            inputMode="decimal"
            min={0}
            placeholder="0"
            value={filters.priceMin ?? ""}
            onChange={(e) => onChange({ priceMin: parseNum(e.target.value) })}
          />
        </Field>

        <Field label="Price max" hint="$">
          <input
            className="control"
            type="number"
            inputMode="decimal"
            min={0}
            placeholder="Any"
            value={filters.priceMax ?? ""}
            onChange={(e) => onChange({ priceMax: parseNum(e.target.value) })}
          />
        </Field>

        <Field label="P/E max">
          <input
            className="control"
            type="number"
            inputMode="decimal"
            min={0}
            placeholder="Any"
            value={filters.peMax ?? ""}
            onChange={(e) => onChange({ peMax: parseNum(e.target.value) })}
          />
        </Field>

        <Field label="Div yield min" hint="%">
          <input
            className="control"
            type="number"
            inputMode="decimal"
            min={0}
            step={0.1}
            placeholder="Any"
            value={filters.dividendYieldMin ?? ""}
            onChange={(e) => onChange({ dividendYieldMin: parseNum(e.target.value) })}
          />
        </Field>

        <Field label="Beta max">
          <input
            className="control"
            type="number"
            inputMode="decimal"
            min={0}
            step={0.1}
            placeholder="Any"
            value={filters.betaMax ?? ""}
            onChange={(e) => onChange({ betaMax: parseNum(e.target.value) })}
          />
        </Field>
      </div>
    </div>
  );
}
