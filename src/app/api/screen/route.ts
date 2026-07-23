import { NextResponse } from "next/server";
import { getPool } from "@/lib/fmp";
import type { ScreenResponse } from "@/lib/types";

/**
 * Returns the screenable pool (live from FMP when a key is set, otherwise sample data).
 * The browser filters and sorts this pool locally, so screening stays instant and
 * API usage stays tiny.
 */
export async function GET() {
  const { results, source, notice } = await getPool();
  const body: ScreenResponse = {
    results,
    universe: results.length,
    source,
    ...(notice ? { notice } : {}),
  };
  return NextResponse.json(body);
}
