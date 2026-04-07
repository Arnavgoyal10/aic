"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, Loader2, AlertCircle, RefreshCw, Upload } from "lucide-react";

interface BodhiOracleProps {
  ticker: string;
  pitchDate: string;
  pitchPdfUrl?: string;
}

type Status = "idle" | "loading" | "streaming" | "done" | "error";

const LOADING_PHASES = [
  { msg: "Connecting to BODHI Oracle…", pct: 12 },
  { msg: "Fetching pitch deck…", pct: 28 },
  { msg: "Parsing investment thesis…", pct: 44 },
  { msg: "Querying live market data…", pct: 62 },
  { msg: "Running thesis validation…", pct: 78 },
  { msg: "Synthesizing findings…", pct: 92 },
];

const AIC_GREEN = "#16a34a";
const AIC_GREEN_DARK = "#15803d";

// ─── Markdown component map ───────────────────────────────────────────────────
const mdComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-lg font-bold mt-6 mb-2" style={{ color: "#0f172a" }}>
      {children}
    </h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2
      className="text-base font-semibold mt-5 mb-2 pb-1.5 flex items-center gap-2"
      style={{ color: "#0f172a", borderBottom: "1px solid #f1f5f9" }}
    >
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-sm font-semibold mt-4 mb-1.5" style={{ color: "#334155" }}>
      {children}
    </h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-sm leading-relaxed mb-3" style={{ color: "#475569" }}>
      {children}
    </p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="mb-3 space-y-1.5 ml-1">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="mb-3 space-y-1.5 ml-4 list-decimal">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="flex items-start gap-2 text-sm" style={{ color: "#475569" }}>
      <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: AIC_GREEN }} />
      <span className="flex-1">{children}</span>
    </li>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold" style={{ color: "#0f172a" }}>
      {children}
    </strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="italic" style={{ color: "#64748b" }}>
      {children}
    </em>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code
      className="text-xs px-1.5 py-0.5 rounded font-mono"
      style={{ background: "#f1f5f9", color: "#334155" }}
    >
      {children}
    </code>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote
      className="pl-4 py-1 my-3 text-sm italic rounded-r-lg"
      style={{
        borderLeft: `3px solid ${AIC_GREEN}`,
        background: "#f0fdf4",
        color: "#166534",
      }}
    >
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4" style={{ borderColor: "#f1f5f9" }} />,
};

export default function BodhiOracle({ ticker, pitchDate, pitchPdfUrl }: BodhiOracleProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [phaseIdx, setPhaseIdx] = useState(0);
  const phaseTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const hasPdf = !!(pitchPdfUrl?.trim());

  // Auto-scroll as output grows
  useEffect(() => {
    if (status === "streaming" && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output, status]);

  // Cleanup interval on unmount
  useEffect(() => () => { if (phaseTimer.current) clearInterval(phaseTimer.current); }, []);

  const runOracle = async () => {
    if (!hasPdf) return;
    setStatus("loading");
    setOutput("");
    setError("");
    setPhaseIdx(0);

    // Cycle through loading phases
    let idx = 0;
    phaseTimer.current = setInterval(() => {
      idx = Math.min(idx + 1, LOADING_PHASES.length - 1);
      setPhaseIdx(idx);
    }, 2200);

    try {
      const response = await fetch("/api/oracle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfUrl: pitchPdfUrl, ticker }),
      });

      // Non-streaming error (4xx/5xx before the stream starts)
      if (!response.ok) {
        const json = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        throw new Error(json.error ?? `Server error ${response.status}`);
      }

      if (!response.body) throw new Error("No response body from server.");

      clearInterval(phaseTimer.current!);
      setStatus("streaming");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setOutput((prev) => prev + chunk);
      }

      setStatus("done");
    } catch (err: unknown) {
      clearInterval(phaseTimer.current!);
      setError((err as Error).message ?? "Something went wrong.");
      setStatus("error");
    }
  };

  const reset = () => {
    setStatus("idle");
    setOutput("");
    setError("");
    setPhaseIdx(0);
  };

  const currentPhase = LOADING_PHASES[phaseIdx];

  return (
    <section>
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "#ffffff",
          border: "1px solid #f1f5f9",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        }}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid #f8fafc" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "#f0fdf4" }}
            >
              <Sparkles className="w-4 h-4" style={{ color: AIC_GREEN }} />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: "#0f172a" }}>
                BODHI Oracle
              </h2>
              <p className="text-[10px]" style={{ color: "#94a3b8" }}>
                AI thesis validation · Gemini 1.5 Flash + Google Search
              </p>
            </div>
          </div>

          {/* Ticker badge */}
          <div
            className="text-xs font-bold px-2.5 py-1 rounded-lg"
            style={{ background: "#f0fdf4", color: AIC_GREEN }}
          >
            {ticker}
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────── */}
        <div className="px-6 py-5">

          {/* No PDF uploaded state */}
          {!hasPdf && (
            <div
              className="flex flex-col items-center justify-center py-8 rounded-xl text-center"
              style={{ background: "#fafafa", border: "1.5px dashed #e2e8f0" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: "#f1f5f9" }}
              >
                <Upload className="w-5 h-5" style={{ color: "#94a3b8" }} />
              </div>
              <p className="text-sm font-medium" style={{ color: "#64748b" }}>
                No pitch deck uploaded
              </p>
              <p className="text-xs mt-1 max-w-xs" style={{ color: "#94a3b8" }}>
                Upload the {ticker} pitch deck PDF to Firebase Storage and paste the download URL into{" "}
                <code
                  className="px-1 py-0.5 rounded text-[10px] font-mono"
                  style={{ background: "#e2e8f0" }}
                >
                  members.json → pitchPdfUrl
                </code>
              </p>
            </div>
          )}

          {/* Idle state — CTA button */}
          {hasPdf && status === "idle" && (
            <div className="flex flex-col items-center py-6 gap-4">
              <div
                className="text-center max-w-sm"
              >
                <p className="text-sm" style={{ color: "#64748b" }}>
                  The Oracle reads your original pitch deck, queries live market
                  data via Google Search, and delivers a verdict on whether the
                  thesis still holds.
                </p>
                <p className="text-xs mt-1.5" style={{ color: "#94a3b8" }}>
                  Pitched {new Date(pitchDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>

              <button
                onClick={runOracle}
                className="group flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${AIC_GREEN} 0%, ${AIC_GREEN_DARK} 100%)`,
                  boxShadow: "0 4px 16px rgba(22,163,74,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
                }}
              >
                <Sparkles className="w-4 h-4 transition-transform group-hover:rotate-12" />
                Run Post-Pitch Analysis
              </button>
            </div>
          )}

          {/* Loading state */}
          {status === "loading" && (
            <div className="flex flex-col items-center py-8 gap-5">
              {/* Animated icon */}
              <div className="relative">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: "#f0fdf4" }}
                >
                  <Sparkles
                    className="w-7 h-7 animate-pulse"
                    style={{ color: AIC_GREEN }}
                  />
                </div>
                {/* Ripple rings */}
                <div
                  className="absolute inset-0 rounded-2xl animate-ping opacity-20"
                  style={{ background: AIC_GREEN }}
                />
              </div>

              {/* Progress bar */}
              <div className="w-full max-w-xs">
                <div
                  className="h-1 rounded-full overflow-hidden"
                  style={{ background: "#f1f5f9" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-[2200ms] ease-out"
                    style={{
                      width: `${currentPhase.pct}%`,
                      background: `linear-gradient(90deg, ${AIC_GREEN}, #4ade80)`,
                    }}
                  />
                </div>
                <p
                  className="text-xs text-center mt-2.5 font-medium"
                  style={{ color: AIC_GREEN }}
                >
                  {currentPhase.msg}
                </p>
              </div>
            </div>
          )}

          {/* Streaming + Done state */}
          {(status === "streaming" || status === "done") && (
            <div>
              {/* Status bar */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {status === "streaming" ? (
                    <>
                      <div
                        className="w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{ background: AIC_GREEN }}
                      />
                      <span className="text-xs font-medium" style={{ color: AIC_GREEN }}>
                        Streaming analysis…
                      </span>
                    </>
                  ) : (
                    <>
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: AIC_GREEN }}
                      />
                      <span className="text-xs font-medium" style={{ color: "#64748b" }}>
                        Analysis complete
                      </span>
                    </>
                  )}
                </div>
                {status === "done" && (
                  <button
                    onClick={reset}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-all hover:bg-slate-100"
                    style={{ color: "#94a3b8" }}
                  >
                    <RefreshCw className="w-3 h-3" />
                    Re-run
                  </button>
                )}
              </div>

              {/* Output */}
              <div
                ref={outputRef}
                className="max-h-[520px] overflow-y-auto pr-1"
                style={{
                  // Fade-in mask at top for polish
                  maskImage: "linear-gradient(to bottom, transparent 0%, black 32px)",
                }}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={mdComponents}
                >
                  {output}
                </ReactMarkdown>

                {/* Blinking cursor while streaming */}
                {status === "streaming" && (
                  <span
                    className="inline-block w-0.5 h-4 ml-0.5 align-middle animate-[pulse_0.8s_ease-in-out_infinite]"
                    style={{ background: AIC_GREEN }}
                  />
                )}
              </div>
            </div>
          )}

          {/* Error state */}
          {status === "error" && (
            <div>
              <div
                className="flex items-start gap-3 p-4 rounded-xl mb-4"
                style={{ background: "#fef2f2", border: "1px solid #fee2e2" }}
              >
                <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-rose-700">Oracle error</p>
                  <p className="text-xs text-rose-500 mt-0.5">{error}</p>
                </div>
              </div>
              <button
                onClick={reset}
                className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg transition-all"
                style={{ color: "#64748b", background: "#f8fafc" }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
