"use client";

import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend,
} from "recharts";
import portfolioData from "@/data/portfolio.json";

const AIC_GREEN = "#16a34a";
const AIC_DARK = "#15803d";

const SECTOR_COLORS = [
  "#16a34a", "#2563eb", "#7c3aed", "#ea580c",
  "#db2777", "#0d9488", "#ca8a04", "#94a3b8",
];

function fmt(n: number) {
  if (Math.abs(n) >= 100_000) return `₹${(n / 100_000).toFixed(2)}L`;
  if (Math.abs(n) >= 1_000) return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
}

function pct(n: number) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

// ── Donut label ──────────────────────────────────────────────────────────────
const RADIAN = Math.PI / 180;
function DonutLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
  cx?: number; cy?: number; midAngle?: number;
  innerRadius?: number; outerRadius?: number; percent?: number;
}) {
  if (!cx || !cy || midAngle == null || !innerRadius || !outerRadius || !percent) return null;
  if (percent < 0.05) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      fontSize={10} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

// ── Custom bar tooltip ───────────────────────────────────────────────────────
function BarTooltip({ active, payload }: { active?: boolean; payload?: { payload: { symbol: string; pnl: number; pct: number } }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const pos = d.pnl >= 0;
  return (
    <div className="rounded-xl px-3 py-2 text-xs shadow-lg"
      style={{ background: "var(--c-surface-raised)", border: "1px solid var(--c-border)", color: "var(--c-text)" }}>
      <p className="font-bold mb-0.5">{d.symbol}</p>
      <p style={{ color: pos ? AIC_GREEN : "#ef4444" }}>{fmt(d.pnl)} ({pct(d.pct)})</p>
    </div>
  );
}

export default function FundSnapshot() {
  const { portfolio, grandTotal } = portfolioData;

  const totalReturn = ((grandTotal.valueAtCmp - grandTotal.valueAtCost) / grandTotal.valueAtCost) * 100;
  const dayPnL = grandTotal.unrealizedDaysPnL;

  // ── Sector allocation data for donut ────────────────────────────────────
  const sectorData = useMemo(() =>
    portfolio.map((s) => ({
      name: s.sector,
      value: Math.round(s.subTotal.valueAtCmp),
    })),
    [portfolio]
  );

  // ── Per-holding P&L bar data ─────────────────────────────────────────────
  const holdingData = useMemo(() =>
    portfolio.flatMap((s) =>
      s.holdings.map((h) => ({
        symbol: h.stockSymbol,
        pnl: h.unrealizedOverallPnL,
        pct: h.profitLossPercent,
      }))
    ).sort((a, b) => b.pct - a.pct),
    [portfolio]
  );

  return (
    <div className="mt-10 space-y-5">
      {/* ── Section header ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 rounded-full" style={{ background: AIC_GREEN }} />
        <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: "var(--c-text-3)" }}>
          Fund Portfolio
        </h2>
      </div>

      {/* ── Headline metrics ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Invested", value: fmt(grandTotal.valueAtCost), sub: null, positive: null },
          { label: "Current Value", value: fmt(grandTotal.valueAtCmp), sub: null, positive: null },
          {
            label: "Overall P&L",
            value: fmt(grandTotal.unrealizedOverallPnL),
            sub: pct(totalReturn),
            positive: grandTotal.unrealizedOverallPnL >= 0,
          },
          {
            label: "Today's P&L",
            value: fmt(dayPnL),
            sub: null,
            positive: dayPnL >= 0,
          },
        ].map((m) => (
          <div key={m.label} className="rounded-2xl px-4 py-3"
            style={{ background: "var(--c-surface-raised)", border: "1px solid var(--c-border)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--c-text-3)" }}>
              {m.label}
            </p>
            <p className="text-lg font-bold tabular-nums"
              style={{ color: m.positive === null ? "var(--c-text)" : m.positive ? AIC_GREEN : "#ef4444" }}>
              {m.value}
            </p>
            {m.sub && (
              <p className="text-xs font-semibold mt-0.5 tabular-nums"
                style={{ color: m.positive ? AIC_GREEN : "#ef4444" }}>
                {m.sub}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ── Charts row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Sector allocation donut */}
        <div className="rounded-2xl px-4 py-4"
          style={{ background: "var(--c-surface-raised)", border: "1px solid var(--c-border)" }}>
          <p className="text-xs font-semibold mb-3" style={{ color: "var(--c-text-2)" }}>
            Sector Allocation
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={sectorData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                dataKey="value"
                labelLine={false}
                label={DonutLabel}
              >
                {sectorData.map((_, i) => (
                  <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />
                ))}
              </Pie>
              <Legend
                iconType="circle"
                iconSize={7}
                formatter={(value) => (
                  <span style={{ fontSize: 10, color: "var(--c-text-2)" }}>{value}</span>
                )}
              />
              <Tooltip
                formatter={(value) => [fmt(Number(value)), "Value"]}
                contentStyle={{
                  background: "var(--c-surface-raised)",
                  border: "1px solid var(--c-border)",
                  borderRadius: 12,
                  fontSize: 11,
                  color: "var(--c-text)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Per-holding P&L bar chart */}
        <div className="rounded-2xl px-4 py-4"
          style={{ background: "var(--c-surface-raised)", border: "1px solid var(--c-border)" }}>
          <p className="text-xs font-semibold mb-3" style={{ color: "var(--c-text-2)" }}>
            Holding P&amp;L
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={holdingData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <XAxis dataKey="symbol" tick={{ fontSize: 9, fill: "var(--c-text-3)" }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={(v) => `${v > 0 ? "+" : ""}${v.toFixed(0)}%`}
                tick={{ fontSize: 9, fill: "var(--c-text-3)" }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<BarTooltip />} cursor={{ fill: "var(--c-border-subtle)" }} />
              <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                {holdingData.map((d, i) => (
                  <Cell key={i} fill={d.pct >= 0 ? AIC_GREEN : "#ef4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Holdings table ───────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid var(--c-border)" }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: "var(--c-border-subtle)" }}>
              {["Symbol", "Sector", "Qty", "Avg Cost", "CMP", "Invested", "Value", "P&L", "Return"].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left font-semibold uppercase tracking-wide"
                  style={{ color: "var(--c-text-3)", fontSize: 9 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {portfolio.flatMap((sector) =>
              sector.holdings.map((h, i) => {
                const pos = h.profitLossPercent >= 0;
                return (
                  <tr key={h.stockSymbol}
                    className="border-t transition-colors hover:opacity-80"
                    style={{
                      borderColor: "var(--c-border-subtle)",
                      background: i % 2 === 0 ? "var(--c-surface-raised)" : "var(--c-surface)",
                    }}>
                    <td className="px-3 py-2.5 font-bold" style={{ color: "var(--c-text)" }}>{h.stockSymbol}</td>
                    <td className="px-3 py-2.5" style={{ color: "var(--c-text-3)" }}>{sector.sector}</td>
                    <td className="px-3 py-2.5 tabular-nums" style={{ color: "var(--c-text-2)" }}>{h.totalQty}</td>
                    <td className="px-3 py-2.5 tabular-nums" style={{ color: "var(--c-text-2)" }}>₹{h.avgCostPrice.toFixed(2)}</td>
                    <td className="px-3 py-2.5 tabular-nums" style={{ color: "var(--c-text)" }}>₹{h.cmp.toFixed(2)}</td>
                    <td className="px-3 py-2.5 tabular-nums" style={{ color: "var(--c-text-2)" }}>{fmt(h.valueAtCost)}</td>
                    <td className="px-3 py-2.5 tabular-nums font-semibold" style={{ color: "var(--c-text)" }}>{fmt(h.valueAtCmp)}</td>
                    <td className="px-3 py-2.5 tabular-nums font-semibold" style={{ color: pos ? AIC_GREEN : "#ef4444" }}>
                      {fmt(h.unrealizedOverallPnL)}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums font-bold" style={{ color: pos ? AIC_GREEN : "#ef4444" }}>
                      {pct(h.profitLossPercent)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot>
            <tr style={{ background: "var(--c-border-subtle)", borderTop: `2px solid var(--c-border)` }}>
              <td colSpan={5} className="px-3 py-2.5 font-bold text-xs" style={{ color: "var(--c-text)" }}>Total</td>
              <td className="px-3 py-2.5 font-bold tabular-nums" style={{ color: "var(--c-text)" }}>{fmt(grandTotal.valueAtCost)}</td>
              <td className="px-3 py-2.5 font-bold tabular-nums" style={{ color: "var(--c-text)" }}>{fmt(grandTotal.valueAtCmp)}</td>
              <td className="px-3 py-2.5 font-bold tabular-nums" style={{ color: totalReturn >= 0 ? AIC_GREEN : "#ef4444" }}>
                {fmt(grandTotal.unrealizedOverallPnL)}
              </td>
              <td className="px-3 py-2.5 font-bold tabular-nums" style={{ color: totalReturn >= 0 ? AIC_GREEN : "#ef4444" }}>
                {pct(totalReturn)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
