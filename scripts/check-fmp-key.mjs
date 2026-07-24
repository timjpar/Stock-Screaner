#!/usr/bin/env node
/*
  Verifies the configured FMP key against the three endpoints the app actually uses.

  Costs 3 requests against the daily quota. Run it after pasting a key, or when live data
  stops working, to tell a rejected key apart from an exhausted quota or a plan restriction.

    npm run check-key
*/

import { readFile } from "node:fs/promises";

const HOST = "https://financialmodelingprep.com";

async function loadKey() {
  if (process.env.FMP_API_KEY?.trim()) return process.env.FMP_API_KEY.trim();
  try {
    const env = await readFile(new URL("../.env.local", import.meta.url), "utf8");
    const line = env.split("\n").find((l) => l.trim().startsWith("FMP_API_KEY="));
    return line?.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "") ?? "";
  } catch {
    return "";
  }
}

async function probe(label, path, key) {
  const sep = path.includes("?") ? "&" : "?";
  try {
    const res = await fetch(`${HOST}${path}${sep}apikey=${key}`, {
      signal: AbortSignal.timeout(15000),
    });
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      return { label, ok: false, detail: `malformed response (HTTP ${res.status})` };
    }
    const errMsg = !Array.isArray(json) && json?.["Error Message"];
    if (!res.ok || errMsg) {
      return { label, ok: false, detail: errMsg || `HTTP ${res.status}` };
    }
    if (!Array.isArray(json) || json.length === 0) {
      return { label, ok: false, detail: "empty response" };
    }
    return { label, ok: true, detail: `${json.length} row(s), e.g. ${json[0].symbol ?? "?"}` };
  } catch (err) {
    return { label, ok: false, detail: err.message };
  }
}

const key = await loadKey();
if (!key) {
  console.error("✗ No FMP_API_KEY found in .env.local (or the environment).");
  console.error("  Get a free key at https://site.financialmodelingprep.com/developer/docs");
  console.error("  then set FMP_API_KEY=your_key_here in .env.local");
  process.exit(1);
}

console.log(`Checking key ending in …${key.slice(-4)} (${key.length} chars)\n`);

// The three endpoints src/lib/fmp.ts depends on. `profile` is the load-bearing one:
// without it there is no pool, because the free tier has no bulk/screener endpoint.
const checks = [
  await probe("profile    (pool + detail)", `/stable/profile?symbol=AAPL`, key),
  await probe("ratios-ttm (P/E, EPS)    ", `/stable/ratios-ttm?symbol=AAPL`, key),
  await probe("quote      (detail price)", `/stable/quote?symbol=AAPL`, key),
];

for (const c of checks) console.log(`  ${c.ok ? "✓" : "✗"} ${c.label}  ${c.detail}`);
console.log("");

const [profile, ratios] = checks;
const authFailed = checks.every((c) => /invalid api key/i.test(c.detail));

if (authFailed) {
  console.log("✗ The key was rejected. Copy it again from the FMP dashboard → API Keys.");
  console.log("  A brand-new key can take a few minutes to activate.");
  process.exit(1);
}
if (!profile.ok) {
  console.log("✗ /stable/profile is unavailable, so the live pool can't be built.");
  console.log("  The app will keep serving sample data. See the message above for the reason.");
  process.exit(1);
}
if (!ratios.ok) {
  console.log("⚠ Live data will work, but the P/E and EPS columns will be blank");
  console.log("  (/stable/ratios-ttm is unavailable on this plan).");
  process.exit(0);
}
console.log("✓ Live data will work. Restart `npm run dev` if it's already running.");
