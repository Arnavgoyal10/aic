import { notFound } from "next/navigation";
import membersData from "@/data/members.json";
import AlphaGraph from "@/components/AlphaGraph";
import ConvictionMeter from "@/components/ConvictionMeter";
import MemberGuard from "@/components/MemberGuard";
import BodhiOracle from "@/components/BodhiOracle";
import { Star, Heart, Target, ArrowRight, BookOpen } from "lucide-react";

interface Member {
  id: string;
  name: string;
  email: string;
  image: string;
  bio: string;
  presidentMemory: string;
  favMemory: string;
  pastPitch: { ticker: string; date: string };
  nextPitch: { ticker: string; thesis: string };
  pitchPdfUrl?: string;
}

interface PageProps {
  params: Promise<{ memberId: string }>;
}

export async function generateStaticParams() {
  return membersData.map((m) => ({ memberId: m.id }));
}

export default async function MemberPage({ params }: PageProps) {
  const { memberId } = await params;
  const member = (membersData as Member[]).find((m) => m.id === memberId);

  if (!member) notFound();

  return (
    <MemberGuard memberId={memberId}>
    <div className="max-w-3xl mx-auto px-6 py-8 pb-24">
      {/* ─── Profile Header ─────────────────────────────────── */}
      <div className="flex items-start gap-5 mb-8">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div
            className="w-20 h-20 rounded-2xl overflow-hidden border-2"
            style={{ borderColor: "#16a34a" }}
          >
            <img
              src={member.image}
              alt={member.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center"
            style={{ background: "#16a34a" }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>
        </div>

        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[#0f172a] leading-none">
            {member.name}
          </h1>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed max-w-lg">
            {member.bio}
          </p>
        </div>
      </div>

      {/* ─── Analyst Spotlight ──────────────────────────────── */}
      <section className="mb-6">
        <div
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #f0fdf4 100%)",
            border: "1.5px solid #bbf7d0",
          }}
        >
          {/* Decorative corner accent */}
          <div
            className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-20"
            style={{ background: "#16a34a" }}
          />

          <div className="flex items-center gap-2.5 mb-4 relative">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "#16a34a" }}
            >
              <Star className="w-3.5 h-3.5 text-white" fill="white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#15803d] tracking-wide uppercase">
                Analyst Spotlight
              </h2>
              <p className="text-[10px] text-[#16a34a]/70">
                From the President's desk
              </p>
            </div>
          </div>

          <blockquote className="text-sm text-[#166534] leading-relaxed relative font-medium">
            <span
              className="absolute -top-1 -left-1 text-3xl text-[#16a34a]/20 font-serif leading-none select-none"
              aria-hidden
            >
              &ldquo;
            </span>
            <span className="relative pl-3">{member.presidentMemory}</span>
          </blockquote>
        </div>
      </section>

      {/* ─── Favorite Memory ────────────────────────────────── */}
      <section className="mb-6">
        <div
          className="rounded-2xl p-5 flex items-start gap-3"
          style={{
            background: "#fafafa",
            border: "1px solid #f1f5f9",
          }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: "#fef3c7" }}
          >
            <Heart className="w-3.5 h-3.5" style={{ color: "#d97706" }} fill="#d97706" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
              Favorite Memory
            </h3>
            <p className="text-sm text-[#0f172a] leading-relaxed italic">
              &ldquo;{member.favMemory}&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* ─── Alpha Graph ─────────────────────────────────────── */}
      <section className="mb-6">
        <div
          className="rounded-2xl p-6"
          style={{
            background: "#ffffff",
            border: "1px solid #f1f5f9",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}
        >
          <div className="flex items-center gap-2 mb-5">
            <BookOpen className="w-4 h-4 text-[#16a34a]" />
            <div>
              <h2 className="text-sm font-bold text-[#0f172a]">
                Performance Since Pitch
              </h2>
              <p className="text-[10px] text-slate-400">
                {member.pastPitch.ticker} vs. Nifty 50 ·{" "}
                {new Date(member.pastPitch.date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          <AlphaGraph
            ticker={member.pastPitch.ticker}
            pitchDate={member.pastPitch.date}
          />
        </div>
      </section>

      {/* ─── Next Pitch Pipeline ─────────────────────────────── */}
      <section>
        <div
          className="rounded-2xl p-6"
          style={{
            background: "#ffffff",
            border: "1px solid #f1f5f9",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}
        >
          <div className="flex items-center gap-2 mb-5">
            <Target className="w-4 h-4 text-[#16a34a]" />
            <div>
              <h2 className="text-sm font-bold text-[#0f172a]">
                Next Pitch Pipeline
              </h2>
              <p className="text-[10px] text-slate-400">
                Upcoming coverage · hype it up
              </p>
            </div>
          </div>

          {/* Ticker card */}
          <div
            className="flex items-center gap-4 p-4 rounded-xl mb-5"
            style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm text-white"
              style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}
            >
              {member.nextPitch.ticker.replace(".NS", "").slice(0, 3)}
            </div>
            <div className="flex-1">
              <p className="text-base font-bold text-[#0f172a]">
                {member.nextPitch.ticker}
              </p>
              <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                {member.nextPitch.thesis}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />
          </div>

          {/* Conviction Meter */}
          <ConvictionMeter memberId={member.id} ticker={member.nextPitch.ticker} />
        </div>
      </section>

      {/* ─── BODHI Oracle ────────────────────────────────────── */}
      <section className="mt-6">
        <BodhiOracle
          ticker={member.pastPitch.ticker}
          pitchDate={member.pastPitch.date}
          pitchPdfUrl={member.pitchPdfUrl}
        />
      </section>
    </div>
    </MemberGuard>
  );
}
