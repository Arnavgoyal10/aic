"use client";

import { useState, useCallback, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown, Download, Activity } from "lucide-react";

interface Pitch {
  id: string;
  company: string;
  ticker: string;
  date: string;
  pdf: string;
  batch: string;
}

interface DataPoint {
  date: string;
  stockReturn: number;
  niftyReturn: number;
}

interface PitchDashboardProps {
  pitches: Pitch[];
  alphas: Record<string, number | null>;
}

const NIFTY_COLOR = "#94a3b8";
const NEGATIVE_COLOR = "#0d9488";
const AIC_GREEN = "#16a34a";
const AIC_DARK = "#15803d";

// One distinct color per stock
const STOCK_COLORS = [
  "#16a34a", "#2563eb", "#7c3aed", "#ea580c",
  "#db2777", "#0d9488", "#ca8a04", "#dc2626",
];

const BATCH_LABELS: Record<string, string> = {
  aug2025: "August 2025",
  jan2026: "January 2026",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function AlphaBadge({ alpha, color }: { alpha: number | null; color?: string }) {
  if (alpha === null) return null;
  const pos = alpha >= 0;
  return (
    <span
      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums"
      style={{
        background: pos ? "#dcfce7" : "#ccfbf1",
        color: color ?? (pos ? AIC_DARK : NEGATIVE_COLOR),
      }}
    >
      {pos ? "+" : ""}{alpha.toFixed(1)}%
    </span>
  );
}

// ── Multi-stock tooltip ──────────────────────────────────────────────────────
const MultiTooltip = ({
  active, payload, label, pitches, colorMap,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number; color: string }[];
  label?: string;
  pitches: Pitch[];
  colorMap: Record<string, string>;
}) => {
  if (!active || !payload?.length) return null;
  const stockPayloads = payload.filter((p) => p.dataKey !== "niftyReturn");
  const niftyPayload = payload.find((p) => p.dataKey === "niftyReturn");
  return (
    <div
      className="rounded-xl p-3 text-xs"
      style={{
        background: "var(--c-surface-raised)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)",
      }}
    >
      <p className="font-medium mb-2" style={{ color: "var(--c-text-3)" }}>{label}</p>
      {stockPayloads.map((p) => {
        const pitch = pitches.find((pi) => pi.id === p.dataKey);
        if (p.value == null) return null;
        return (
          <div key={p.dataKey} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: colorMap[p.dataKey] }} />
            <span style={{ color: "var(--c-text-3)" }}>{pitch?.ticker ?? p.dataKey}:</span>
            <span className="font-semibold" style={{ color: p.value >= 0 ? colorMap[p.dataKey] : NEGATIVE_COLOR }}>
              {p.value >= 0 ? "+" : ""}{p.value.toFixed(2)}%
            </span>
          </div>
        );
      })}
      {niftyPayload && niftyPayload.value != null && (
        <div className="flex items-center gap-2 mt-1 pt-1" style={{ borderTop: "1px solid var(--c-border)" }}>
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: NIFTY_COLOR }} />
          <span style={{ color: "var(--c-text-3)" }}>Nifty 50:</span>
          <span className="font-semibold" style={{ color: "var(--c-text-2)" }}>
            {niftyPayload.value >= 0 ? "+" : ""}{niftyPayload.value.toFixed(2)}%
          </span>
        </div>
      )}
    </div>
  );
};

// ── Multi-pitch graph ────────────────────────────────────────────────────────
function MultiPitchGraph({
  selectedPitches,
  alphas,
  colorMap,
  seriesCache,
  onSeriesFetched,
}: {
  selectedPitches: Pitch[];
  alphas: Record<string, number | null>;
  colorMap: Record<string, string>;
  seriesCache: Record<string, DataPoint[]>;
  onSeriesFetched: (id: string, series: DataPoint[]) => void;
}) {
  const [fetching, setFetching] = useState<Set<string>>(new Set());

  // Fetch any missing series
  useEffect(() => {
    const toFetch = selectedPitches.filter(
      (p) => !seriesCache[p.id] && !fetching.has(p.id)
    );
    if (!toFetch.length) return;

    setFetching((prev) => {
      const next = new Set(prev);
      toFetch.forEach((p) => next.add(p.id));
      return next;
    });

    toFetch.forEach(async (pitch) => {
      try {
        const res = await fetch(`/api/stock?ticker=${encodeURIComponent(pitch.ticker)}`);
        const json = await res.json();
        if (!json.error) onSeriesFetched(pitch.id, json.series);
      } finally {
        setFetching((prev) => {
          const next = new Set(prev);
          next.delete(pitch.id);
          return next;
        });
      }
    });
  }, [selectedPitches, seriesCache, fetching, onSeriesFetched]);

  const isLoading = selectedPitches.some(
    (p) => !seriesCache[p.id] && (fetching.has(p.id) || true)
  );
  const allLoaded = selectedPitches.every((p) => !!seriesCache[p.id]);

  if (!allLoaded) {
    return (
      <div className="h-64 flex items-center justify-center gap-2" style={{ color: "var(--c-text-3)" }}>
        <Activity className="w-4 h-4 animate-pulse" />
        <span className="text-sm">Loading market data…</span>
      </div>
    );
  }

  // Build combined dataset: union of all dates, each pitch has its own key
  const dateMap = new Map<string, Record<string, number | null>>();

  // Seed with nifty from the first available series
  const firstSeries = seriesCache[selectedPitches[0].id] ?? [];
  firstSeries.forEach((pt) => {
    dateMap.set(pt.date, { niftyReturn: pt.niftyReturn });
  });

  // Merge each pitch's stock returns
  selectedPitches.forEach((pitch) => {
    const series = seriesCache[pitch.id] ?? [];
    series.forEach((pt) => {
      const existing = dateMap.get(pt.date) ?? { niftyReturn: pt.niftyReturn };
      existing[pitch.id] = pt.stockReturn;
      dateMap.set(pt.date, existing);
    });
  });

  // Sort by date and fill gaps with null
  const combined = Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => {
      const point: Record<string, number | null | string> = {
        date,
        niftyReturn: vals.niftyReturn ?? null,
      };
      selectedPitches.forEach((p) => {
        point[p.id] = vals[p.id] ?? null;
      });
      return point;
    });

  // Downsample for rendering
  const display =
    combined.length > 120
      ? combined.filter((_, i) => i % Math.floor(combined.length / 120) === 0 || i === combined.length - 1)
      : combined;

  const xCount = Math.min(6, display.length);
  const ticks = Array.from({ length: xCount }, (_, i) =>
    display[Math.floor((i * (display.length - 1)) / Math.max(xCount - 1, 1))]?.date as string
  ).filter(Boolean);

  function downloadAllCSV() {
    const headers = ["Date", "Nifty 50 (%)", ...selectedPitches.map((p) => `${p.ticker} (%)`)];
    const rows = combined.map((pt) => [
      pt.date,
      pt.niftyReturn ?? "",
      ...selectedPitches.map((p) => pt[p.id] ?? ""),
    ].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bodhi_comparison_${selectedPitches.map((p) => p.ticker).join("_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const isSingle = selectedPitches.length === 1;
  const singlePitch = isSingle ? selectedPitches[0] : null;
  const singleSeries = singlePitch ? seriesCache[singlePitch.id] : null;
  const singleAlpha = singlePitch ? (alphas[singlePitch.id] ?? null) : null;

  return (
    <div>
      {/* Metrics row */}
      {isSingle && singleSeries ? (
        // Single-stock metrics (original layout)
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: "var(--c-text-3)" }}>
              Alpha Generated
            </p>
            <div className="flex items-center gap-2">
              <span
                className="text-3xl font-bold tabular-nums"
                style={{ color: singleAlpha !== null && singleAlpha >= 0 ? colorMap[singlePitch!.id] : NEGATIVE_COLOR }}
              >
                {singleAlpha !== null && singleAlpha >= 0 ? "+" : ""}{singleAlpha?.toFixed(2)}%
              </span>
              {singleAlpha !== null && singleAlpha >= 0
                ? <TrendingUp className="w-5 h-5" style={{ color: colorMap[singlePitch!.id] }} />
                : <TrendingDown className="w-5 h-5" style={{ color: NEGATIVE_COLOR }} />
              }
            </div>
            <p className="text-xs mt-0.5" style={{ color: "var(--c-text-3)" }}>
              vs. Nifty 50 since{" "}
              {new Date(singlePitch!.date).toLocaleDateString("en-IN", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </p>
          </div>
          <div className="flex gap-5 items-end pb-0.5">
            <div className="text-right">
              <p className="text-[10px] mb-0.5" style={{ color: "var(--c-text-3)" }}>{singlePitch!.ticker}</p>
              <p className="text-base font-semibold" style={{ color: colorMap[singlePitch!.id] }}>
                {singleSeries[singleSeries.length - 1]?.stockReturn >= 0 ? "+" : ""}
                {singleSeries[singleSeries.length - 1]?.stockReturn.toFixed(2)}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] mb-0.5" style={{ color: "var(--c-text-3)" }}>Nifty 50</p>
              <p className="text-base font-semibold" style={{ color: "var(--c-text-2)" }}>
                {singleSeries[singleSeries.length - 1]?.niftyReturn >= 0 ? "+" : ""}
                {singleSeries[singleSeries.length - 1]?.niftyReturn.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      ) : (
        // Multi-stock metrics: compact row of cards
        <div className="flex flex-wrap gap-2 mb-5">
          {selectedPitches.map((pitch) => {
            const series = seriesCache[pitch.id];
            const lastReturn = series?.[series.length - 1]?.stockReturn;
            const alpha = alphas[pitch.id];
            const color = colorMap[pitch.id];
            const pos = alpha !== null && alpha !== undefined && alpha >= 0;
            return (
              <div
                key={pitch.id}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                style={{
                  background: "var(--c-border-subtle)",
                  border: `1.5px solid ${color}30`,
                }}
              >
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                <div>
                  <p className="text-[10px] font-semibold leading-none" style={{ color: "var(--c-text-2)" }}>
                    {pitch.company}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs font-bold tabular-nums" style={{ color }}>
                      {lastReturn !== undefined ? `${lastReturn >= 0 ? "+" : ""}${lastReturn.toFixed(1)}%` : "—"}
                    </span>
                    {alpha !== null && alpha !== undefined && (
                      <span
                        className="text-[9px] font-bold px-1 py-0.5 rounded-full tabular-nums"
                        style={{
                          background: pos ? "#dcfce7" : "#ccfbf1",
                          color: pos ? AIC_DARK : NEGATIVE_COLOR,
                        }}
                      >
                        α {pos ? "+" : ""}{alpha.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Chart */}
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={display} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border-subtle)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "var(--c-text-3)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatDate}
            ticks={ticks}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--c-text-3)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v > 0 ? "+" : ""}${v}%`}
          />
          <ReferenceLine y={0} stroke="var(--c-border)" strokeWidth={1} />
          <Tooltip
            content={
              <MultiTooltip pitches={selectedPitches} colorMap={colorMap} />
            }
            cursor={{ stroke: "var(--c-border)", strokeWidth: 1 }}
          />
          {/* Nifty 50 reference line */}
          <Line
            type="monotone"
            dataKey="niftyReturn"
            stroke={NIFTY_COLOR}
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="4 2"
            connectNulls={false}
          />
          {/* One line per selected stock */}
          {selectedPitches.map((pitch) => (
            <Line
              key={pitch.id}
              type="monotone"
              dataKey={pitch.id}
              stroke={colorMap[pitch.id]}
              strokeWidth={isSingle ? 2.5 : 2}
              dot={false}
              strokeLinecap="round"
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Legend + download */}
      <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          {selectedPitches.map((pitch) => (
            <div key={pitch.id} className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 rounded-full" style={{ background: colorMap[pitch.id] }} />
              <span className="text-xs" style={{ color: "var(--c-text-3)" }}>{pitch.ticker}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div
              className="w-4 h-0.5 rounded-full"
              style={{
                background: `repeating-linear-gradient(90deg, ${NIFTY_COLOR} 0, ${NIFTY_COLOR} 4px, transparent 4px, transparent 6px)`,
              }}
            />
            <span className="text-xs" style={{ color: "var(--c-text-3)" }}>Nifty 50</span>
          </div>
        </div>
        <button
          onClick={downloadAllCSV}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all hover:scale-105 active:scale-95"
          style={{ background: "var(--c-green-bg)", color: AIC_GREEN, border: "1px solid var(--c-green-border)" }}
        >
          <Download className="w-3 h-3" />
          Download CSV
        </button>
      </div>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function PitchDashboard({ pitches, alphas }: PitchDashboardProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([pitches[0]?.id ?? ""]);
  const [seriesCache, setSeriesCache] = useState<Record<string, DataPoint[]>>({});

  const handleSeriesFetched = useCallback((id: string, series: DataPoint[]) => {
    setSeriesCache((prev) => ({ ...prev, [id]: series }));
  }, []);

  const toggleId = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        // Don't deselect the last one
        if (prev.length === 1) return prev;
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  }, []);

  // Assign stable colors to pitches (by index, not by selection order)
  const colorMap: Record<string, string> = {};
  pitches.forEach((p, i) => {
    colorMap[p.id] = STOCK_COLORS[i % STOCK_COLORS.length];
  });

  const batches = Array.from(new Set(pitches.map((p) => p.batch)));
  const selectedPitches = pitches.filter((p) => selectedIds.includes(p.id));

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--c-surface-raised)",
        border: "1px solid var(--c-border)",
        boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
      }}
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--c-border-subtle)" }}
      >
        <div>
          <h2 className="text-sm font-bold" style={{ color: "var(--c-text)" }}>Club Coverage</h2>
          <p className="text-[10px] mt-0.5" style={{ color: "var(--c-text-3)" }}>
            {pitches.length} pitches · select multiple to compare
          </p>
        </div>
        <div
          className="text-xs font-medium px-2.5 py-1 rounded-lg"
          style={{ background: "var(--c-green-bg)", color: AIC_GREEN }}
        >
          vs. Nifty 50
        </div>
      </div>

      {/* ── Pitch toggle chips ──────────────────────────────── */}
      <div className="px-6 pt-4 pb-2">
        {batches.map((batch) => {
          const batchPitches = pitches.filter((p) => p.batch === batch);
          return (
            <div key={batch} className="mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--c-text-3)" }}>
                {BATCH_LABELS[batch] ?? batch}
              </p>
              <div className="flex flex-wrap gap-2">
                {batchPitches.map((pitch) => {
                  const isActive = selectedIds.includes(pitch.id);
                  const color = colorMap[pitch.id];
                  const alpha = alphas[pitch.id];
                  return (
                    <button
                      key={pitch.id}
                      onClick={() => toggleId(pitch.id)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        background: isActive ? `${color}12` : "var(--c-border-subtle)",
                        border: isActive ? `1.5px solid ${color}` : "1.5px solid var(--c-border)",
                        color: isActive ? color : "var(--c-text-3)",
                        boxShadow: isActive ? `0 2px 8px ${color}25` : "none",
                      }}
                    >
                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                      )}
                      <span>{pitch.company}</span>
                      <AlphaBadge alpha={alpha} color={isActive ? color : undefined} />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        <p className="text-[10px] mt-1 mb-1" style={{ color: "var(--c-text-4)" }}>
          Click multiple chips to overlay stocks on the same chart
        </p>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "var(--c-border-subtle)", margin: "0 24px" }} />

      {/* ── Graph ─────────────────────────────────────────── */}
      <div className="px-6 py-5">
        {/* Title bar — show all selected companies */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {selectedPitches.map((pitch) => (
            <div key={pitch.id} className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                style={{ background: colorMap[pitch.id] }}
              >
                {pitch.company.slice(0, 2).toUpperCase()}
              </div>
              <div className="mr-3">
                <p className="text-xs font-bold leading-none" style={{ color: "var(--c-text)" }}>
                  {pitch.company}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--c-text-3)" }}>
                  {pitch.ticker}
                </p>
              </div>
            </div>
          ))}
        </div>

        <MultiPitchGraph
          key={selectedIds.slice().sort().join(",")}
          selectedPitches={selectedPitches}
          alphas={alphas}
          colorMap={colorMap}
          seriesCache={seriesCache}
          onSeriesFetched={handleSeriesFetched}
        />
      </div>
    </div>
  );
}
