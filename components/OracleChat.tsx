"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, X, Send, ChevronDown, Filter } from "lucide-react";
import pitches from "@/data/pitches.json";

const AIC_GREEN = "#16a34a";
const AIC_DARK = "#15803d";

const BATCH_LABELS: Record<string, string> = {
  aug2025: "Aug 2025",
  jan2026: "Jan 2026",
};

interface Message {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

export default function OracleChat() {
  const [open, setOpen] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(pitches.map((p) => p.id));

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const togglePitch = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const assistantIdx = newMessages.length;
    setMessages((prev) => [...prev, { role: "assistant", content: "", streaming: true }]);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/oracle/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          selectedPitchIds: selectedIds,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        setMessages((prev) => {
          const next = [...prev];
          next[assistantIdx] = {
            role: "assistant",
            content: `> ⚠️ **Error:** ${err.error}`,
            streaming: false,
          };
          return next;
        });
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const next = [...prev];
          next[assistantIdx] = { role: "assistant", content: accumulated, streaming: true };
          return next;
        });
      }

      setMessages((prev) => {
        const next = [...prev];
        next[assistantIdx] = { role: "assistant", content: accumulated, streaming: false };
        return next;
      });
    } catch (err: unknown) {
      if ((err as Error).name === "AbortError") return;
      setMessages((prev) => {
        const next = [...prev];
        next[assistantIdx] = {
          role: "assistant",
          content: "> ⚠️ **Connection error.** Please try again.",
          streaming: false,
        };
        return next;
      });
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [input, messages, loading, selectedIds]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const batches = Array.from(new Set(pitches.map((p) => p.batch)));

  return (
    <div className="fixed bottom-5 left-60 z-40 flex flex-col items-start">
      {/* ── Chat panel ─────────────────────────────────────── */}
      {open && (
        <div
          className="mb-3 w-[380px] rounded-2xl overflow-hidden flex flex-col"
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            boxShadow: "0 8px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)",
            maxHeight: "520px",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ background: `linear-gradient(135deg, ${AIC_GREEN} 0%, ${AIC_DARK} 100%)` }}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-sm font-bold text-white">BODHI Oracle</span>
              <span className="text-[10px] text-green-200 ml-1">AI Analyst</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowFilter((v) => !v)}
                className="p-1.5 rounded-lg text-green-200 hover:text-white hover:bg-white/10 transition-colors"
                title="Select pitch context"
              >
                <Filter className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-green-200 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Pitch filter panel */}
          {showFilter && (
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 shrink-0">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">
                Pitch context
              </p>
              {batches.map((batch) => (
                <div key={batch} className="mb-2">
                  <p className="text-[9px] font-semibold text-slate-300 uppercase tracking-widest mb-1.5">
                    {BATCH_LABELS[batch] ?? batch}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {pitches
                      .filter((p) => p.batch === batch)
                      .map((pitch) => {
                        const on = selectedIds.includes(pitch.id);
                        return (
                          <button
                            key={pitch.id}
                            onClick={() => togglePitch(pitch.id)}
                            className="text-[10px] px-2 py-0.5 rounded-full transition-all font-medium"
                            style={{
                              background: on ? "#dcfce7" : "#f1f5f9",
                              color: on ? AIC_DARK : "#94a3b8",
                              border: on ? `1px solid #bbf7d0` : "1px solid #e2e8f0",
                            }}
                          >
                            {pitch.company}
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-0">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div
                  className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center"
                  style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
                >
                  <Sparkles className="w-5 h-5 text-[#16a34a]" />
                </div>
                <p className="text-xs font-semibold text-[#0f172a] mb-1">BODHI Oracle</p>
                <p className="text-[11px] text-slate-400 leading-relaxed max-w-[260px] mx-auto">
                  Ask me about any of the club&apos;s covered companies — thesis evolution,
                  moats, recent earnings, or what&apos;s changed since the pitch.
                </p>
                <div className="mt-4 space-y-1.5">
                  {[
                    "How has the Interarch thesis held up?",
                    "What's changed for TIPS Industries?",
                    "Compare Skipper vs NDR Alpha",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="block w-full text-left text-[11px] px-3 py-2 rounded-lg transition-all hover:scale-[1.01]"
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        color: "#64748b",
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "user" ? (
                  <div
                    className="max-w-[80%] rounded-2xl rounded-br-sm px-3.5 py-2.5 text-xs text-white leading-relaxed"
                    style={{ background: `linear-gradient(135deg, ${AIC_GREEN}, ${AIC_DARK})` }}
                  >
                    {msg.content}
                  </div>
                ) : (
                  <div className="max-w-[90%]">
                    <div
                      className="rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-xs leading-relaxed"
                      style={{ background: "#f8fafc", border: "1px solid #f1f5f9" }}
                    >
                      {msg.content ? (
                        <div className="prose prose-xs max-w-none oracle-prose">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                          {msg.streaming && (
                            <span
                              className="inline-block w-1 h-3 ml-0.5 rounded-full animate-pulse"
                              style={{ background: AIC_GREEN, verticalAlign: "middle" }}
                            />
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <span
                            className="w-1 h-1 rounded-full animate-bounce"
                            style={{ background: AIC_GREEN, animationDelay: "0ms" }}
                          />
                          <span
                            className="w-1 h-1 rounded-full animate-bounce"
                            style={{ background: AIC_GREEN, animationDelay: "150ms" }}
                          />
                          <span
                            className="w-1 h-1 rounded-full animate-bounce"
                            style={{ background: AIC_GREEN, animationDelay: "300ms" }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            className="px-3 py-3 border-t border-slate-100 shrink-0"
            style={{ background: "#fafafa" }}
          >
            <div
              className="flex items-end gap-2 rounded-xl px-3 py-2"
              style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about any covered company…"
                rows={1}
                disabled={loading}
                className="flex-1 resize-none text-xs text-[#0f172a] placeholder:text-slate-300 outline-none bg-transparent leading-relaxed"
                style={{ maxHeight: "80px", overflowY: "auto" }}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="p-1.5 rounded-lg transition-all shrink-0 disabled:opacity-40"
                style={{ background: AIC_GREEN }}
              >
                <Send className="w-3 h-3 text-white" />
              </button>
            </div>
            <p className="text-[9px] text-slate-300 text-center mt-1.5">
              Powered by Gemini · Google Search grounded
            </p>
          </div>
        </div>
      )}

      {/* ── Toggle button ────────────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold text-white transition-all hover:scale-105 active:scale-95"
        style={{
          background: open
            ? "#64748b"
            : `linear-gradient(135deg, ${AIC_GREEN} 0%, ${AIC_DARK} 100%)`,
          boxShadow: open
            ? "none"
            : "0 4px 16px rgba(22,163,74,0.35), 0 0 0 1px rgba(22,163,74,0.1)",
        }}
      >
        {open ? (
          <>
            <X className="w-3.5 h-3.5" />
            Close Oracle
          </>
        ) : (
          <>
            <Sparkles className="w-3.5 h-3.5" />
            BODHI Oracle
          </>
        )}
      </button>
    </div>
  );
}
