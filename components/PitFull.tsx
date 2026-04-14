"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { db } from "@/lib/firebase";
import {
  ref, push, onValue, remove, query, orderByChild, off, DataSnapshot,
} from "firebase/database";
import { MessageSquare, Send, Zap, Bell, BellOff } from "lucide-react";
import { usePitNotifications } from "@/lib/usePitNotifications";

interface Message {
  id: string;
  text: string;
  timestamp: number;
  accent: string;
}

const MESSAGE_TTL_MS = 5 * 60 * 1000;

const ACCENTS = ["#16a34a","#0d9488","#2563eb","#7c3aed","#db2777","#ea580c","#ca8a04"];
const randomAccent = () => ACCENTS[Math.floor(Math.random() * ACCENTS.length)];

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  return `${Math.floor(diff / 60)}m ago`;
}

export default function PitFull() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const { permission: notifPermission, requestPermission: requestNotifPermission, myToken } = usePitNotifications();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesRef = ref(db, "pit/messages");


  const pruneOldMessages = useCallback(async (snapshot: DataSnapshot) => {
    const now = Date.now();
    const toDelete: string[] = [];
    snapshot.forEach((child) => {
      const data = child.val();
      if (data?.timestamp && now - data.timestamp > MESSAGE_TTL_MS) {
        toDelete.push(child.key as string);
      }
    });
    await Promise.all(toDelete.map((key) => remove(ref(db, `pit/messages/${key}`))));
  }, []);

  useEffect(() => {
    const q = query(messagesRef, orderByChild("timestamp"));
    onValue(q, (snapshot) => {
      pruneOldMessages(snapshot);
      const msgs: Message[] = [];
      snapshot.forEach((child) => {
        const data = child.val();
        if (data?.timestamp && Date.now() - data.timestamp <= MESSAGE_TTL_MS) {
          msgs.push({ id: child.key as string, ...data });
        }
      });
      setMessages(msgs);
    });
    const interval = setInterval(() => {
      onValue(q, pruneOldMessages, { onlyOnce: true });
    }, 30_000);
    return () => { off(q); clearInterval(interval); };
  }, [pruneOldMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");
    try {
      await push(messagesRef, { text, timestamp: Date.now(), accent: randomAccent() });
      fetch("/api/pit/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, senderToken: myToken }),
      }).catch(() => {});
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="h-full flex flex-col" style={{ background: "var(--c-bg)" }}>
      {/* Header */}
      <div
        className="px-6 py-4 flex items-center justify-between shrink-0"
        style={{ background: "var(--c-surface-raised)", borderBottom: "1px solid var(--c-border)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "var(--c-green-bg)", border: "1px solid var(--c-green-border)" }}
          >
            <MessageSquare className="w-5 h-5 text-[#16a34a]" />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight" style={{ color: "var(--c-text)" }}>The Pit</h1>
            <p className="text-xs" style={{ color: "var(--c-text-3)" }}>Anonymous · Ephemeral · 5-min messages</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {notifPermission !== null && notifPermission !== "granted" && (
            <button
              onClick={requestNotifPermission}
              disabled={notifPermission === "denied"}
              title={notifPermission === "denied" ? "Notifications blocked — reset in browser settings" : "Enable notifications for new messages"}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
              style={{
                background: notifPermission === "denied" ? "var(--c-border-subtle)" : "#fef3c7",
                color: notifPermission === "denied" ? "var(--c-text-3)" : "#92400e",
                border: `1px solid ${notifPermission === "denied" ? "var(--c-border)" : "#fcd34d"}`,
                cursor: notifPermission === "denied" ? "not-allowed" : "pointer",
              }}
            >
              {notifPermission === "denied" ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
              {notifPermission === "denied" ? "Notifications blocked" : "Enable notifications"}
            </button>
          )}
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#16a34a] animate-pulse" />
            <span className="text-xs font-medium" style={{ color: "var(--c-text-3)" }}>Live</span>
          </div>
          {messages.length > 0 && (
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: "var(--c-green-bg)", color: "#16a34a", border: "1px solid var(--c-green-border)" }}
            >
              {messages.length} message{messages.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--c-border-subtle)", border: "1px solid var(--c-border)" }}
            >
              <Zap className="w-8 h-8" style={{ color: "var(--c-text-4)" }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--c-text-3)" }}>The floor is yours</p>
              <p className="text-xs max-w-xs" style={{ color: "var(--c-text-3)" }}>
                Drop a hot take, a thesis, or a trade idea. Messages self-destruct in 5 minutes.
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className="flex flex-col gap-1">
                <div
                  className="inline-block max-w-[80%] px-4 py-3 rounded-2xl text-sm break-words leading-relaxed"
                  style={{
                    background: `${msg.accent}12`,
                    borderLeft: `3px solid ${msg.accent}`,
                    color: "var(--c-text)",
                  }}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] pl-1" style={{ color: "var(--c-text-4)" }}>
                  {timeAgo(msg.timestamp)}
                </span>
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
        <form onSubmit={sendMessage} className="max-w-2xl mx-auto flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Say something… (anonymous)"
            maxLength={280}
            className="flex-1 px-4 py-3 rounded-xl text-sm outline-none transition-all"
            style={{
              background: "var(--c-input-bg)",
              border: "1px solid var(--c-border)",
              color: "var(--c-text)",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
            onBlur={(e) => (e.target.style.borderColor = "var(--c-border)")}
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="px-5 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-center text-[10px] mt-2" style={{ color: "var(--c-text-4)" }}>
          Fully anonymous · Messages vanish after 5 minutes
        </p>
      </div>
    </div>
  );
}
