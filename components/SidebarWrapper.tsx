"use client";

import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { useDark } from "@/lib/DarkModeContext";
import members from "@/data/members.json";
import ThePit from "./ThePit";
import OracleChat from "./OracleChat";
import { TrendingUp, LogOut, BarChart2, MessageSquare, Sparkles, Sun, Moon, LayoutDashboard } from "lucide-react";
import Link from "next/link";

function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

const AIC_GREEN = "#16a34a";

export default function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, memberId, loading } = useAuth();
  const { dark, toggle } = useDark();

  if (pathname === "/login") return <>{children}</>;

  const myMember = memberId ? members.find((m) => m.id === memberId) : null;

  // Hide floating panels on their dedicated pages
  const showFloatingPit = pathname !== "/pit";
  const showFloatingOracle = pathname !== "/oracle";

  const handleLogout = async () => {
    await signOut(auth);
    deleteCookie("aic-session");
    router.push("/login");
  };

  const navItem = (href: string, icon: React.ReactNode, label: string) => {
    const active = pathname === href || pathname.startsWith(href + "/");
    return (
      <Link
        href={href}
        className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all"
        style={{
          background: active ? "var(--c-green-bg)" : "transparent",
          color: active ? AIC_GREEN : "var(--c-text-3)",
          border: active ? "1px solid var(--c-green-border)" : "1px solid transparent",
        }}
      >
        {icon}
        {label}
      </Link>
    );
  };

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--c-bg)" }}
    >
      {/* ── Sidebar ───────────────────────────────────────── */}
      <aside
        className="w-56 shrink-0 flex flex-col"
        style={{
          background: "var(--c-surface)",
          borderRight: "1px solid var(--c-border)",
          boxShadow: "2px 0 12px rgba(0,0,0,0.04)",
        }}
      >
        {/* Logo */}
        <div className="px-5 py-5" style={{ borderBottom: "1px solid var(--c-border)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "var(--c-green-bg)", border: "1px solid var(--c-green-border)" }}
              >
                <TrendingUp className="w-4 h-4" style={{ color: AIC_GREEN }} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-bold leading-none" style={{ color: "var(--c-text)" }}>BODHI</p>
                <p className="text-[10px] mt-0.5 tracking-wider uppercase" style={{ color: "var(--c-text-3)" }}>Capital</p>
              </div>
            </div>
            {/* Dark mode toggle */}
            <button
              onClick={toggle}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110"
              style={{ background: "var(--c-border-subtle)", color: "var(--c-text-3)" }}
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Member card */}
        <div className="px-4 py-5 flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-full animate-pulse" style={{ background: "var(--c-border)" }} />
              <div className="h-3 w-24 rounded animate-pulse" style={{ background: "var(--c-border)" }} />
            </div>
          ) : myMember ? (
            <div className="space-y-4">
              <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: "var(--c-text-3)" }}>
                My Profile
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border-2"
                  style={{ borderColor: AIC_GREEN }}
                >
                  <img src={myMember.image} alt={myMember.name} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate leading-tight" style={{ color: "var(--c-text)" }}>
                    {myMember.name.split(" ")[0]}
                  </p>
                  <p className="text-[10px] truncate mt-0.5" style={{ color: "var(--c-text-3)" }}>
                    {myMember.name.split(" ").slice(1).join(" ")}
                  </p>
                </div>
              </div>

              {/* Club stats */}
              <div
                className="rounded-xl p-3"
                style={{ background: "var(--c-border-subtle)", border: "1px solid var(--c-border)" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <BarChart2 className="w-3.5 h-3.5" style={{ color: AIC_GREEN }} />
                  <span className="text-[10px] font-semibold" style={{ color: "var(--c-text)" }}>Club Coverage</span>
                </div>
                <p className="text-[10px]" style={{ color: "var(--c-text-3)" }}>8 pitches tracked</p>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--c-text-3)" }}>Aug 2025 · Jan 2026</p>
              </div>
            </div>
          ) : (
            <p className="text-xs" style={{ color: "var(--c-text-3)" }}>Welcome to BODHI Capital</p>
          )}

          {/* Navigation */}
          <div className="mt-5 space-y-1">
            <p className="text-[10px] font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--c-text-4)" }}>
              Navigate
            </p>
            {memberId && navItem(
              `/${memberId}`,
              <LayoutDashboard className="w-3.5 h-3.5" />,
              "Dashboard"
            )}
            {navItem(
              "/pit",
              <MessageSquare className="w-3.5 h-3.5" />,
              "The Pit"
            )}
            {navItem(
              "/oracle",
              <Sparkles className="w-3.5 h-3.5" />,
              "BODHI Oracle"
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-4" style={{ borderTop: "1px solid var(--c-border)" }}>
          {user?.email && (
            <p className="text-[10px] mb-2 truncate px-1" style={{ color: "var(--c-text-4)" }}>{user.email}</p>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-sm transition-all hover:bg-rose-50 hover:text-rose-500"
            style={{ color: "var(--c-text-3)" }}
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto" style={{ background: "var(--c-surface)" }}>
        {children}
      </main>

      {showFloatingPit && <ThePit />}
      {showFloatingOracle && <OracleChat />}
    </div>
  );
}
