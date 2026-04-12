"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import members from "@/data/members.json";
import { TrendingUp, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

function setCookie(name: string, value: string, days = 7) {
  if (typeof document !== "undefined") {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Strict`;
  }
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("Enter your email above first, then click Forgot Password.");
      return;
    }
    setResetLoading(true);
    setError("");
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
    } catch {
      setError("Could not send reset email. Make sure your email is registered.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const token = await credential.user.getIdToken();
      setCookie("aic-session", token, 7);

      // Redirect to the member's own profile if they have one, else first member
      const matchedMember = members.find(
        (m) => m.email.toLowerCase() === credential.user.email?.toLowerCase()
      );
      const explicitRedirect = searchParams.get("redirect");
      const destination =
        explicitRedirect || (matchedMember ? `/${matchedMember.id}` : `/${members[0].id}`);
      router.push(destination);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (
        code === "auth/user-not-found" ||
        code === "auth/wrong-password" ||
        code === "auth/invalid-credential"
      ) {
        setError("Invalid credentials. This portal is members-only.");
      } else {
        setError("Authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#16a34a 1px, transparent 1px), linear-gradient(90deg, #16a34a 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {/* Glowing radial */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(22,163,74,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#f0fdf4] border border-[#bbf7d0] mb-4">
            <TrendingUp className="w-7 h-7 text-[#16a34a]" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0f172a]">
            BODHI Capital
          </h1>
          <p className="text-sm text-slate-400 mt-1 tracking-widest uppercase font-medium">
            Member Portal
          </p>
        </div>

        <div
          className="bg-white rounded-2xl p-8"
          style={{
            boxShadow:
              "0 0 0 1px rgba(0,0,0,0.06), 0 4px 6px -1px rgba(0,0,0,0.04), 0 10px 40px -4px rgba(0,0,0,0.08)",
          }}
        >
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-[#0f172a]">Sign in</h2>
            <p className="text-sm text-slate-400 mt-0.5">Authorized personnel only.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 tracking-wide uppercase">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@bodhicapital.in"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-[#0f172a] placeholder:text-slate-300 outline-none transition-all focus:border-[#16a34a] bg-white"
                style={{ boxShadow: "none" }}
                onFocus={(e) => (e.target.style.boxShadow = "0 0 0 3px rgba(22,163,74,0.1)")}
                onBlur={(e) => (e.target.style.boxShadow = "none")}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 tracking-wide uppercase">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-slate-200 text-sm text-[#0f172a] placeholder:text-slate-300 outline-none transition-all focus:border-[#16a34a] bg-white"
                  style={{ boxShadow: "none" }}
                  onFocus={(e) => (e.target.style.boxShadow = "0 0 0 3px rgba(22,163,74,0.1)")}
                  onBlur={(e) => (e.target.style.boxShadow = "none")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-100">
                <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                <p className="text-xs text-rose-600">{error}</p>
              </div>
            )}

            {resetSent && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#f0fdf4] border border-[#bbf7d0]">
                <CheckCircle2 className="w-4 h-4 text-[#16a34a] mt-0.5 shrink-0" />
                <p className="text-xs text-[#15803d]">
                  Reset email sent to <strong>{email}</strong>. Check your inbox.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: loading
                  ? "#86efac"
                  : "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                boxShadow: loading
                  ? "none"
                  : "0 2px 8px rgba(22,163,74,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Authenticating…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Lock className="w-3.5 h-3.5" />
                  Access Portal
                </span>
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={resetLoading}
              className="text-xs text-slate-400 hover:text-[#16a34a] transition-colors disabled:opacity-50"
            >
              {resetLoading ? "Sending…" : "Forgot password?"}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-300 mt-6">
          BODHI Capital · Internal Use Only · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
