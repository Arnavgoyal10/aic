import { writeFileSync, readFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const pitches = JSON.parse(readFileSync(join(root, "data/pitches.json"), "utf8"));
const mod = await import("yahoo-finance2");
const yahooFinance = mod.default;
const yf = new yahooFinance({ suppressNotices: ["ripHistorical"] });
const today = new Date().toISOString().split("T")[0];

async function fetchSeries(ticker, pitchDate) {
  const [stockData, niftyData] = await Promise.all([
    yf.chart(ticker, { period1: pitchDate, period2: today, interval: "1d" }),
    yf.chart("^NSEI", { period1: pitchDate, period2: today, interval: "1d" }),
  ]);
  const stockQuotes = (stockData.quotes || []).filter(q => q.close != null);
  const niftyQuotes = (niftyData.quotes || []).filter(q => q.close != null);
  if (!stockQuotes.length || !niftyQuotes.length) throw new Error("Empty quotes");
  const niftyMap = new Map();
  for (const q of niftyQuotes) niftyMap.set(new Date(q.date).toISOString().split("T")[0], q.close);
  const stockBase = stockQuotes[0].close;
  const niftyBase = niftyQuotes[0].close;
  const series = [];
  for (const q of stockQuotes) {
    if (q.close == null) continue;
    const dateStr = new Date(q.date).toISOString().split("T")[0];
    const niftyClose = niftyMap.get(dateStr);
    if (niftyClose == null) continue;
    series.push({
      date: dateStr,
      stockReturn: +((q.close / stockBase - 1) * 100).toFixed(2),
      niftyReturn: +((niftyClose / niftyBase - 1) * 100).toFixed(2),
    });
  }
  const latest = series[series.length - 1];
  const alpha = +((latest?.stockReturn ?? 0) - (latest?.niftyReturn ?? 0)).toFixed(2);
  return { series, alpha, ticker, fetched: today };
}

mkdirSync(join(root, "stock_data"), { recursive: true });
console.log(`Fetching ${pitches.length} tickers...\n`);

for (const pitch of pitches) {
  const { ticker, date, company } = pitch;
  process.stdout.write(`  ${company.padEnd(26)} (${ticker.padEnd(15)}) ... `);
  try {
    const result = await fetchSeries(ticker, date);
    const filename = join(root, "stock_data", `${ticker.replace(/\./g, "_")}.json`);
    writeFileSync(filename, JSON.stringify(result, null, 2));
    const sign = result.alpha >= 0 ? "+" : "";
    console.log(`OK  ${result.series.length} rows  alpha ${sign}${result.alpha}%`);
  } catch (e) {
    console.log(`FAIL  ${e.message}`);
  }
}
console.log("\nDone.");
