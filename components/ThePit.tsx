"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { db } from "@/lib/firebase";
import {
  ref,
  push,
  onValue,
  remove,
  query,
  orderByChild,
  off,
  DataSnapshot,
} from "firebase/database";
import { MessageSquare, Send, Zap, ChevronDown, X } from "lucide-react";

interface Message {
  id: string;
  text: string;
  timestamp: number;
  accent: string;
}

const MESSAGE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const ACCENTS = [
  "#16a34a",
  "#0d9488",
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#ca8a04",
];

function randomAccent(): string {
  return ACCENTS[Math.floor(Math.random() * ACCENTS.length)];
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  return `${Math.floor(diff / 60)}m ago`;
}

export default function ThePit() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesRef = ref(db, "pit/messages");

  // Delete messages older than TTL
  const pruneOldMessages = useCallback(async (snapshot: DataSnapshot) => {
    const now = Date.now();
    const toDelete: string[] = [];

    snapshot.forEach((child) => {
      const data = child.val();
      if (data?.timestamp && now - data.timestamp > MESSAGE_TTL_MS) {
        toDelete.push(child.key as string);
      }
    });

    await Promise.all(
      toDelete.map((key) => remove(ref(db, `pit/messages/${key}`)))
    );
  }, []);

  useEffect(() => {
    const q = query(messagesRef, orderByChild("timestamp"));

    const unsubscribe = onValue(q, (snapshot) => {
      // Prune old messages
      pruneOldMessages(snapshot);

      const msgs: Message[] = [];
      snapshot.forEach((child) => {
        const data = child.val();
        const now = Date.now();
        if (data?.timestamp && now - data.timestamp <= MESSAGE_TTL_MS) {
          msgs.push({ id: child.key as string, ...data });
        }
      });
      setMessages(msgs);
    });

    // Periodic prune every 30s
    const pruneInterval = setInterval(() => {
      onValue(q, pruneOldMessages, { onlyOnce: true });
    }, 30_000);

    return () => {
      off(q);
      clearInterval(pruneInterval);
    };
  }, [pruneOldMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setInput("");

    try {
      await push(messagesRef, {
        text,
        timestamp: Date.now(),
        accent: randomAccent(),
      });
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full text-white text-sm font-semibold shadow-lg transition-all hover:scale-105 active:scale-95"
        style={{
          background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
          boxShadow: "0 4px 20px rgba(22,163,74,0.4)",
        }}
      >
        {open ? (
          <X className="w-4 h-4" />
        ) : (
          <>
            <Zap className="w-4 h-4" />
            <span>The Pit</span>
            {messages.length > 0 && (
              <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">
                {messages.length}
              </span>
            )}
          </>
        )}
      </button>

      {/* Chat panel */}
      <div
        className="fixed bottom-16 right-5 z-40 w-80 transition-all duration-300 origin-bottom-right"
        style={{
          transform: open ? "scale(1) translateY(0)" : "scale(0.95) translateY(8px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
      >
        <div
          className="bg-white rounded-2xl overflow-hidden flex flex-col"
          style={{
            boxShadow: "0 0 0 1px rgba(0,0,0,0.06), 0 20px 60px rgba(0,0,0,0.12)",
            height: "440px",
          }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "#f0fdf4" }}
              >
                <MessageSquare className="w-4 h-4 text-[#16a34a]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#0f172a]">
                  The Pit
                </h3>
                <p className="text-xs text-slate-400">Anonymous · Ephemeral</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-pulse" />
              <span className="text-xs text-slate-400">Live</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center gap-2">
                <Zap className="w-8 h-8 text-slate-200" />
                <p className="text-xs text-slate-300 max-w-[180px]">
                  Drop a hot take. Messages self-destruct in 5 minutes.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="group flex flex-col gap-0.5">
                  <div
                    className="inline-block max-w-full px-3 py-2 rounded-xl text-sm text-[#0f172a] break-words"
                    style={{
                      background: `${msg.accent}08`,
                      borderLeft: `3px solid ${msg.accent}`,
                    }}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-slate-300 pl-1">
                    {timeAgo(msg.timestamp)}
                  </span>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-100 p-3">
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Say something…"
                maxLength={280}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm text-[#0f172a] placeholder:text-slate-300 outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/10 transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg, #16a34a, #15803d)",
                }}
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </form>
            <p className="text-[10px] text-slate-300 mt-1.5 pl-1">
              Messages vanish after 5 min · Fully anonymous
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
