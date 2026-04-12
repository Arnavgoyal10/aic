"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, Send, Filter, X, ChevronDown, ChevronUp } from "lucide-react";
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

const STARTERS = [
  "How has the Interarch thesis held up since the pitch?",
  "What's changed for TIPS Industries — thesis intact or broken?",
  "Compare NDR Auto vs Skipper alpha generation",
  "What's the biggest risk to Ceinsys right now?",
  "Which of our Jan 2026 pitches has the strongest current thesis?",
];

export default function OracleFull() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(pitches.map((p) => p.id));
  const [showFilter, setShowFilter] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const togglePitch = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const handleSend = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: msg }];
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
          next[assistantIdx] = { role: "assistant", content: `> ⚠️ **Error:** ${err.error}`, streaming: false };
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
        next[assistantIdx] = { role: "assistant", content: "> ⚠️ **Connection error.** Please try again.", streaming: false };
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
    <div className="h-full flex flex-col" style={{ background: "var(--c-bg)" }}>
      {/* Header */}
      <div
        className="px-6 py-4 shrink-0"
        style={{ background: "var(--c-surface-raised)", borderBottom: "1px solid var(--c-border)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${AIC_GREEN}, ${AIC_DARK})` }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight" style={{ color: "var(--c-text)" }}>BODHI Oracle</h1>
              <p className="text-xs" style={{ color: "var(--c-text-3)" }}>
                AI analyst · Gemini 2.5 Flash · Google Search grounded
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowFilter((v) => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: showFilter ? "var(--c-green-bg)" : "var(--c-border-subtle)",
              color: showFilter ? AIC_GREEN : "var(--c-text-3)",
              border: `1px solid ${showFilter ? "var(--c-green-border)" : "var(--c-border)"}`,
            }}
          >
            <Filter className="w-3.5 h-3.5" />
            Context ({selectedIds.length}/{pitches.length})
            {showFilter ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Filter panel */}
        {showFilter && (
          <div
            className="mt-4 p-4 rounded-xl"
            style={{ background: "var(--c-border-subtle)", border: "1px solid var(--c-border)" }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--c-text-3)" }}>
              Pitch decks loaded as context
            </p>
            <div className="flex flex-wrap gap-2">
              {batches.map((batch) => (
                <div key={batch} className="flex flex-wrap gap-2 w-full">
                  <p className="text-[9px] font-semibold uppercase tracking-widest w-full" style={{ color: "var(--c-text-4)" }}>
                    {BATCH_LABELS[batch] ?? batch}
                  </p>
                  {pitches.filter((p) => p.batch === batch).map((pitch) => {
                    const on = selectedIds.includes(pitch.id);
                    return (
                      <button
                        key={pitch.id}
                        onClick={() => togglePitch(pitch.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                        style={{
                          background: on ? "var(--c-green-bg)" : "var(--c-surface-raised)",
                          color: on ? AIC_DARK : "var(--c-text-3)",
                          border: `1px solid ${on ? "var(--c-green-border)" : "var(--c-border)"}`,
                        }}
                      >
                        {on && <div className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />}
                        {pitch.company}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div
                className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${AIC_GREEN}, ${AIC_DARK})` }}
              >
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-lg font-bold mb-2" style={{ color: "var(--c-text)" }}>
                What would you like to analyze?
              </h2>
              <p className="text-sm" style={{ color: "var(--c-text-3)" }}>
                Ask me anything about the club&apos;s covered companies — thesis evolution,
                competitive moats, recent earnings, or how the narrative has changed.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {STARTERS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="text-left text-sm px-4 py-3 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
                  style={{
                    background: "var(--c-surface-raised)",
                    border: "1px solid var(--c-border)",
                    color: "var(--c-text-2)",
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-5">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "user" ? (
                  <div
                    className="max-w-[75%] rounded-2xl rounded-br-sm px-4 py-3 text-sm text-white leading-relaxed"
                    style={{ background: `linear-gradient(135deg, ${AIC_GREEN}, ${AIC_DARK})` }}
                  >
                    {msg.content}
                  </div>
                ) : (
                  <div className="max-w-[88%] w-full">
                    <div
                      className="flex items-center gap-2 mb-2"
                    >
                      <div
                        className="w-5 h-5 rounded-md flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${AIC_GREEN}, ${AIC_DARK})` }}
                      >
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-[10px] font-semibold" style={{ color: "var(--c-text-3)" }}>BODHI Oracle</span>
                    </div>
                    <div
                      className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm"
                      style={{ background: "var(--c-surface-raised)", border: "1px solid var(--c-border)" }}
                    >
                      {msg.content ? (
                        <div className="oracle-prose" style={{ color: "var(--c-text)" }}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                          {msg.streaming && (
                            <span
                              className="inline-block w-1.5 h-4 ml-0.5 rounded-full animate-pulse"
                              style={{ background: AIC_GREEN, verticalAlign: "middle" }}
                            />
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {[0, 150, 300].map((delay) => (
                            <span
                              key={delay}
                              className="w-1.5 h-1.5 rounded-full animate-bounce"
                              style={{ background: AIC_GREEN, animationDelay: `${delay}ms` }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div
        className="px-6 py-4 shrink-0"
        style={{ background: "var(--c-surface-raised)", borderTop: "1px solid var(--c-border)" }}
      >
        <div className="max-w-2xl mx-auto">
          <div
            className="flex items-end gap-3 rounded-xl px-4 py-3"
            style={{ background: "var(--c-input-bg)", border: "1px solid var(--c-border)" }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about any covered company… (Enter to send, Shift+Enter for new line)"
              rows={1}
              disabled={loading}
              className="flex-1 resize-none text-sm outline-none bg-transparent leading-relaxed"
              style={{ maxHeight: "120px", overflowY: "auto", color: "var(--c-text)" }}
            />
            {loading && abortRef.current && (
              <button
                onClick={() => abortRef.current?.abort()}
                className="p-2 rounded-lg transition-all shrink-0"
                style={{ background: "var(--c-border-subtle)", color: "var(--c-text-3)" }}
                title="Stop generating"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="p-2 rounded-lg transition-all shrink-0 disabled:opacity-40 hover:scale-105 active:scale-95"
              style={{ background: AIC_GREEN }}
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
          <p className="text-center text-[10px] mt-2" style={{ color: "var(--c-text-4)" }}>
            Powered by Gemini 2.5 Flash · Google Search grounded · Reads pitch PDFs
          </p>
        </div>
      </div>
    </div>
  );
}
