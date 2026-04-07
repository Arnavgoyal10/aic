"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue, runTransaction } from "firebase/database";
import { Flame, Zap } from "lucide-react";

interface ConvictionMeterProps {
  memberId: string;
  ticker: string;
}

const MAX_VOTES = 50;

export default function ConvictionMeter({ memberId, ticker }: ConvictionMeterProps) {
  const [votes, setVotes] = useState(0);
  const [voted, setVoted] = useState(false);
  const [animating, setAnimating] = useState(false);

  const votesRef = ref(db, `convictions/${memberId}/votes`);

  useEffect(() => {
    const unsub = onValue(votesRef, (snapshot) => {
      setVotes(snapshot.val() ?? 0);
    });
    return () => unsub();
  }, [memberId]);

  // Check local vote state
  useEffect(() => {
    const key = `voted-${memberId}`;
    const stored = sessionStorage.getItem(key);
    if (stored === "true") setVoted(true);
  }, [memberId]);

  const handleVote = async () => {
    if (voted || animating) return;

    setAnimating(true);
    setVoted(true);
    sessionStorage.setItem(`voted-${memberId}`, "true");

    try {
      await runTransaction(votesRef, (current) => {
        return (current ?? 0) + 1;
      });
    } catch (err) {
      console.error("Vote failed:", err);
    }

    setTimeout(() => setAnimating(false), 600);
  };

  const pct = Math.min((votes / MAX_VOTES) * 100, 100);
  const level =
    pct < 25 ? "Low" : pct < 50 ? "Building" : pct < 75 ? "High" : "NUCLEAR";
  const levelColor =
    pct < 25 ? "#94a3b8" : pct < 50 ? "#ca8a04" : pct < 75 ? "#16a34a" : "#dc2626";

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4" style={{ color: levelColor }} />
          <span className="text-sm font-semibold text-[#0f172a]">Conviction Meter</span>
        </div>
        <div
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ color: levelColor, background: `${levelColor}15` }}
        >
          {level}
        </div>
      </div>

      {/* Bar track */}
      <div className="relative h-3 rounded-full bg-slate-100 overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background:
              pct < 25
                ? "#94a3b8"
                : pct < 50
                ? "linear-gradient(90deg, #ca8a04, #f59e0b)"
                : pct < 75
                ? "linear-gradient(90deg, #16a34a, #22c55e)"
                : "linear-gradient(90deg, #dc2626, #f97316)",
            boxShadow: pct >= 50 ? `0 0 8px ${levelColor}40` : "none",
          }}
        />
        {/* Glow pulse for high conviction */}
        {pct >= 75 && (
          <div
            className="absolute inset-0 rounded-full animate-pulse opacity-30"
            style={{ background: levelColor }}
          />
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          <span className="font-semibold text-[#0f172a]">{votes}</span> members hyped
          {votes === 1 ? "" : ""}
        </p>

        <button
          onClick={handleVote}
          disabled={voted}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{
            background: voted ? "#f1f5f9" : "linear-gradient(135deg, #16a34a, #15803d)",
            color: voted ? "#94a3b8" : "#ffffff",
            transform: animating ? "scale(1.15)" : "scale(1)",
            boxShadow: voted ? "none" : "0 2px 8px rgba(22,163,74,0.25)",
          }}
        >
          <Zap className="w-3 h-3" fill={voted ? "none" : "currentColor"} />
          {voted ? "Hyped!" : "Hype it"}
        </button>
      </div>
    </div>
  );
}
