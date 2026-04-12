import { notFound } from "next/navigation";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import membersData from "@/data/members.json";
import pitchesData from "@/data/pitches.json";
import MemberGuard from "@/components/MemberGuard";
import PitchDashboard from "@/components/PitchDashboard";

export async function generateStaticParams() {
  return membersData.map((m) => ({ memberId: m.id }));
}

interface PageProps {
  params: Promise<{ memberId: string }>;
}

// Load pre-computed alpha for every pitch from disk (at build/request time)
function loadPitchAlphas(): Record<string, number | null> {
  const alphas: Record<string, number | null> = {};
  for (const pitch of pitchesData) {
    const filename = pitch.ticker.replace(/\./g, "_") + ".json";
    const filepath = join(process.cwd(), "stock_data", filename);
    if (existsSync(filepath)) {
      try {
        const data = JSON.parse(readFileSync(filepath, "utf8"));
        alphas[pitch.id] = data.alpha ?? null;
      } catch {
        alphas[pitch.id] = null;
      }
    } else {
      alphas[pitch.id] = null;
    }
  }
  return alphas;
}

export default async function MemberPage({ params }: PageProps) {
  const { memberId } = await params;
  const member = membersData.find((m) => m.id === memberId);
  if (!member) notFound();

  const alphas = loadPitchAlphas();

  return (
    <MemberGuard memberId={memberId}>
      <div className="max-w-4xl mx-auto px-6 py-8 pb-24">
        {/* ── Profile header ───────────────────────────────── */}
        <div className="flex items-center gap-5 mb-8">
          <div
            className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border-2"
            style={{ borderColor: "#16a34a" }}
          >
            <img
              src={member.image}
              alt={member.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1
              className="text-2xl font-bold leading-tight"
              style={{ color: "var(--c-text)" }}
            >
              {member.name}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--c-text-3)" }}>
              BODHI Capital · Member Portal
            </p>
          </div>
        </div>

        {/* ── Pitch dashboard ──────────────────────────────── */}
        <PitchDashboard
          pitches={pitchesData}
          alphas={alphas}
        />
      </div>
    </MemberGuard>
  );
}
