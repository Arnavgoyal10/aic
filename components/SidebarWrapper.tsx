"use client";

import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import members from "@/data/members.json";
import ThePit from "./ThePit";
import { TrendingUp, LogOut } from "lucide-react";

function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

export default function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, memberId, loading } = useAuth();
  const isLoginPage = pathname === "/login";

  const handleLogout = async () => {
    await signOut(auth);
    deleteCookie("aic-session");
    router.push("/login");
  };

  if (isLoginPage) return <>{children}</>;

  // Find this user's member record
  const myMember = memberId ? members.find((m) => m.id === memberId) : null;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className="w-60 shrink-0 flex flex-col border-r border-slate-100 bg-white overflow-y-auto"
        style={{ boxShadow: "2px 0 12px rgba(0,0,0,0.03)" }}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#f0fdf4] border border-[#bbf7d0] flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-[#16a34a]" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-bold text-[#0f172a] leading-none">BODHI</p>
              <p className="text-[10px] text-slate-400 mt-0.5 tracking-wider uppercase">Capital</p>
            </div>
          </div>
        </div>

        {/* Member profile card — only their own */}
        <div className="px-3 py-4 flex-1">
          {loading ? (
            <div className="px-2 py-3">
              <div className="h-4 w-24 bg-slate-100 rounded animate-pulse mb-2" />
              <div className="h-3 w-16 bg-slate-100 rounded animate-pulse" />
            </div>
          ) : myMember ? (
            <>
              <p className="text-[10px] font-semibold text-slate-400 tracking-widest uppercase px-2 mb-3">
                My Profile
              </p>
              <div
                className="flex items-center gap-3 px-3 py-3 rounded-xl"
                style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0" }}
              >
                <div
                  className="w-9 h-9 rounded-full overflow-hidden shrink-0 border-2"
                  style={{ borderColor: "#16a34a" }}
                >
                  <img
                    src={myMember.image}
                    alt={myMember.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#15803d] truncate leading-tight">
                    {myMember.name}
                  </p>
                  <p className="text-[10px] text-[#16a34a]/70 mt-0.5 truncate">
                    Pitching {myMember.nextPitch.ticker}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-4 px-2 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Past pitch</span>
                  <span className="font-medium text-[#0f172a]">{myMember.pastPitch.ticker}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Next pitch</span>
                  <span className="font-medium text-[#16a34a]">{myMember.nextPitch.ticker}</span>
                </div>
              </div>
            </>
          ) : (
            // User logged in but not mapped to a member — show club info
            <div className="px-2 py-3">
              <p className="text-xs text-slate-400">
                Welcome to BODHI Capital
              </p>
            </div>
          )}
        </div>

        {/* User info + logout */}
        <div className="px-3 py-3 border-t border-slate-100">
          {user?.email && (
            <p className="text-[10px] text-slate-400 px-2 mb-2 truncate">{user.email}</p>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-[#fafafa]">{children}</main>

      <ThePit />
    </div>
  );
}
