import { NextResponse } from "next/server";
import { getStockDetail } from "@/lib/fmp";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params;
  const detail = await getStockDetail(symbol);
  if (!detail) {
    return NextResponse.json(
      { error: `No data found for ${symbol.toUpperCase()}.` },
      { status: 404 },
    );
  }
  return NextResponse.json(detail);
}
