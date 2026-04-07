"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

interface DataPoint {
  date: string;
  stockReturn: number;
  niftyReturn: number;
}

interface AlphaGraphProps {
  ticker: string;
  pitchDate: string;
}

const AIC_GREEN = "#16a34a";
const NIFTY_COLOR = "#94a3b8";
const NEGATIVE_COLOR = "#0d9488";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

const CustomTooltip = ({
  active,
  payload,
  label,
  ticker,
}: {
  active?: boolean;
  payload?: { color: string; value: number; name: string }[];
  label?: string;
  ticker: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="bg-white rounded-xl p-3 text-xs"
      style={{
        boxShadow: "0 4px 20px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.06)",
      }}
    >
      <p className="text-slate-400 mb-2 font-medium">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: p.color }}
          />
          <span className="text-slate-500">
            {p.name === "stockReturn" ? ticker : "Nifty 50"}:
          </span>
          <span
            className="font-semibold"
            style={{ color: p.value >= 0 ? AIC_GREEN : NEGATIVE_COLOR }}
          >
            {p.value >= 0 ? "+" : ""}
            {p.value.toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  );
};

export default function AlphaGraph({ ticker, pitchDate }: AlphaGraphProps) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [alpha, setAlpha] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");

    fetch(`/api/stock?ticker=${encodeURIComponent(ticker)}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setData(json.series);
        setAlpha(json.alpha);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [ticker, pitchDate]);

  const isPositive = alpha !== null && alpha >= 0;
  const alphaColor = isPositive ? AIC_GREEN : NEGATIVE_COLOR;

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="flex items-center gap-2.5 text-slate-400">
          <Activity className="w-4 h-4 animate-pulse" />
          <span className="text-sm">Loading market data…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-sm text-slate-400">Could not load chart: {error}</p>
      </div>
    );
  }

  // Subsample for readability on large ranges
  const displayData =
    data.length > 60
      ? data.filter((_, i) => i % Math.floor(data.length / 60) === 0 || i === data.length - 1)
      : data;

  const xTickCount = Math.min(6, displayData.length);
  const tickIndices = Array.from({ length: xTickCount }, (_, i) =>
    Math.floor((i * (displayData.length - 1)) / (xTickCount - 1))
  );

  return (
    <div>
      {/* Alpha metric header */}
      <div className="flex items-start gap-6 mb-6">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">
            Alpha Generated
          </p>
          <div className="flex items-center gap-2">
            <span
              className="text-4xl font-bold tabular-nums"
              style={{ color: alphaColor }}
            >
              {isPositive ? "+" : ""}
              {alpha?.toFixed(2)}%
            </span>
            {isPositive ? (
              <TrendingUp className="w-6 h-6" style={{ color: alphaColor }} />
            ) : (
              <TrendingDown className="w-6 h-6" style={{ color: alphaColor }} />
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            vs. Nifty 50 since{" "}
            {new Date(pitchDate).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="flex-1 flex gap-6 justify-end items-end pb-1">
          <div className="text-right">
            <p className="text-xs text-slate-400 mb-0.5">{ticker}</p>
            <p className="text-lg font-semibold" style={{ color: AIC_GREEN }}>
              {data[data.length - 1]?.stockReturn >= 0 ? "+" : ""}
              {data[data.length - 1]?.stockReturn.toFixed(2)}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 mb-0.5">Nifty 50</p>
            <p className="text-lg font-semibold text-slate-500">
              {data[data.length - 1]?.niftyReturn >= 0 ? "+" : ""}
              {data[data.length - 1]?.niftyReturn.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={displayData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatDate}
            ticks={tickIndices.map((i) => displayData[i]?.date).filter(Boolean)}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v > 0 ? "+" : ""}${v}%`}
          />
          <ReferenceLine y={0} stroke="#e2e8f0" strokeWidth={1} />
          <Tooltip
            content={<CustomTooltip ticker={ticker} />}
            cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }}
          />
          <Line
            type="monotone"
            dataKey="niftyReturn"
            stroke={NIFTY_COLOR}
            strokeWidth={1.5}
            dot={false}
            name="niftyReturn"
            strokeDasharray="4 2"
          />
          <Line
            type="monotone"
            dataKey="stockReturn"
            stroke={AIC_GREEN}
            strokeWidth={2.5}
            dot={false}
            name="stockReturn"
            strokeLinecap="round"
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-5 mt-3 justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 rounded-full" style={{ background: AIC_GREEN }} />
          <span className="text-xs text-slate-400">{ticker}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-4 h-0.5 rounded-full"
            style={{
              background: NIFTY_COLOR,
              backgroundImage: `repeating-linear-gradient(90deg, ${NIFTY_COLOR} 0, ${NIFTY_COLOR} 4px, transparent 4px, transparent 6px)`,
            }}
          />
          <span className="text-xs text-slate-400">Nifty 50</span>
        </div>
      </div>
    </div>
  );
}
