/** Display formatting for market data. All accept null and render an em dash. */

const DASH = "—";

export function fmtPrice(v: number | null): string {
  if (v == null) return DASH;
  return `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fmtPct(v: number | null): string {
  if (v == null) return DASH;
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

export function fmtCompact(v: number | null): string {
  if (v == null) return DASH;
  const abs = Math.abs(v);
  if (abs >= 1e12) return `${(v / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return v.toLocaleString("en-US");
}

export function fmtNum(v: number | null, decimals = 2): string {
  if (v == null) return DASH;
  return v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function fmtInt(v: number | null): string {
  if (v == null) return DASH;
  return Math.round(v).toLocaleString("en-US");
}
