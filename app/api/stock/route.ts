import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get("ticker");

  if (!ticker) {
    return NextResponse.json({ error: "ticker is required" }, { status: 400 });
  }

  const filename = ticker.replace(/\./g, "_") + ".json";
  const filepath = join(process.cwd(), "stock_data", filename);

  if (!existsSync(filepath)) {
    return NextResponse.json(
      { error: `No cached data for ${ticker}. Run: node scripts/fetch-stock-data.mjs` },
      { status: 404 }
    );
  }

  try {
    const raw = readFileSync(filepath, "utf8");
    const data = JSON.parse(raw);

    return NextResponse.json(data, {
      headers: {
        // Cache for 1 hour on the client; re-run the script daily for fresh data
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to read stock data" }, { status: 500 });
  }
}
