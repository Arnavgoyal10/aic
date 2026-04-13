/**
 * Oracle Load Simulator — 30 concurrent users
 * Usage: node scripts/simulate-oracle.mjs [concurrency] [url]
 * Default: 30 users hitting http://localhost:3000
 */

const CONCURRENCY = parseInt(process.argv[2] ?? "30");
const BASE_URL = process.argv[3] ?? "http://localhost:3000";

const QUESTIONS = [
  "What is the core thesis for Interarch Building Products?",
  "Has the Skipper thesis held up since the pitch?",
  "What are the key risks for NDR Auto Components?",
  "How has TIPS Industries performed vs expectations?",
  "What is the moat for Ceinsys Tech?",
  "Is the Entero Healthcare thesis still intact?",
  "What macro tailwinds support Oriana Power?",
  "Compare Skipper and Interarch alpha generation.",
  "What is the bear case for Indegene?",
  "How dependent is NDR Auto on a single OEM?",
  "What is the revenue model for TIPS Industries?",
  "Has the Oriana Power thesis changed since pitch?",
  "What are the catalysts for Ceinsys in the next quarter?",
  "What regulatory risks does Entero Healthcare face?",
  "Is Interarch exposed to steel price volatility?",
  "What is the target return for the Skipper pitch?",
  "How does NDR Auto compare to listed peers?",
  "What is the margin profile of Indegene?",
  "Has Oriana Power won any new contracts recently?",
  "What is the addressable market for Ceinsys?",
  "How does TIPS Industries generate royalty income?",
  "What is the debt situation at Entero Healthcare?",
  "What is the key assumption in the Interarch bull case?",
  "Is Skipper benefiting from the power transmission boom?",
  "What is NDR Auto's exposure to EVs?",
  "What is the growth rate assumption for Indegene?",
  "How capital-intensive is Oriana Power's model?",
  "What is the promoter holding in Ceinsys?",
  "Has TIPS Industries faced any streaming platform risk?",
  "Which of the Jan 2026 pitches has the strongest thesis today?",
];

// Rotate pitch IDs per user so not all 30 hit all 8 PDFs
const ALL_PITCH_IDS = ["ceinsys","entero","indegene","tips","oriana","skipper","ndr","interarch"];
function pitchIdsForUser(i) {
  // Each user picks 2 random pitches (realistic usage)
  const a = ALL_PITCH_IDS[i % ALL_PITCH_IDS.length];
  const b = ALL_PITCH_IDS[(i + 3) % ALL_PITCH_IDS.length];
  return [a, b];
}

const results = {
  success: 0,
  rateLimit: 0,
  busy: 0,
  timeout: 0,
  error: 0,
  times: [],
};

async function simulateUser(userId) {
  const question = QUESTIONS[userId % QUESTIONS.length];
  const pitchIds = pitchIdsForUser(userId);
  const start = Date.now();

  try {
    const res = await fetch(`${BASE_URL}/api/oracle/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: question }],
        selectedPitchIds: pitchIds,
      }),
      signal: AbortSignal.timeout(180_000), // 3 min max
    });

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    if (res.status === 429) {
      results.rateLimit++;
      console.log(`  User ${String(userId + 1).padStart(2)} ⚠️  RATE LIMITED        ${elapsed}s`);
      return;
    }

    if (res.status === 503) {
      const body = await res.json().catch(() => ({}));
      results.busy++;
      console.log(`  User ${String(userId + 1).padStart(2)} 🔴 QUEUE FULL/BUSY     ${elapsed}s  "${(body.error ?? "").slice(0, 50)}"`);
      return;
    }

    if (res.status === 504) {
      results.timeout++;
      console.log(`  User ${String(userId + 1).padStart(2)} ⏱  GEMINI TIMEOUT       ${elapsed}s`);
      return;
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      results.error++;
      console.log(`  User ${String(userId + 1).padStart(2)} ✗  HTTP ${res.status}: ${(body.error ?? "unknown").slice(0,50)}  ${elapsed}s`);
      return;
    }

    // Stream the response to completion
    const reader = res.body.getReader();
    let chars = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chars += value.length;
    }

    const finalElapsed = ((Date.now() - start) / 1000).toFixed(1);
    results.success++;
    results.times.push(parseFloat(finalElapsed));
    console.log(`  User ${String(userId + 1).padStart(2)} ✓  ${finalElapsed}s  (${chars} chars)  [${pitchIds.join("+")}] "${question.slice(0, 40)}…"`);
  } catch (err) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    results.error++;
    const msg = err.name === "TimeoutError" ? "TIMEOUT (>3 min)" : err.message.slice(0, 60);
    console.log(`  User ${String(userId + 1).padStart(2)} ✗  ${msg}  ${elapsed}s`);
  }
}

// ── Run ──────────────────────────────────────────────────────────────────────
console.log(`\nBODHI Oracle — Concurrency Simulation`);
console.log(`Target: ${BASE_URL}`);
console.log(`Users:  ${CONCURRENCY} firing simultaneously`);
console.log(`${"─".repeat(70)}\n`);

const wallStart = Date.now();

// Fire all users at the same time
await Promise.all(
  Array.from({ length: CONCURRENCY }, (_, i) => simulateUser(i))
);

const wallElapsed = ((Date.now() - wallStart) / 1000).toFixed(1);

// ── Report ───────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(70)}`);
console.log(`Results (${CONCURRENCY} users, wall time: ${wallElapsed}s)\n`);
console.log(`  ✓  Success     : ${results.success}`);
console.log(`  ⚠️  Rate limited: ${results.rateLimit}`);
console.log(`  ✗  Errors      : ${results.error}`);

if (results.times.length > 0) {
  const avg = (results.times.reduce((a, b) => a + b, 0) / results.times.length).toFixed(1);
  const min = Math.min(...results.times).toFixed(1);
  const max = Math.max(...results.times).toFixed(1);
  const p90 = results.times.sort((a, b) => a - b)[Math.floor(results.times.length * 0.9)].toFixed(1);
  console.log(`\n  Response times (successful only):`);
  console.log(`    Min : ${min}s`);
  console.log(`    Avg : ${avg}s`);
  console.log(`    P90 : ${p90}s`);
  console.log(`    Max : ${max}s`);
}

const successRate = ((results.success / CONCURRENCY) * 100).toFixed(0);
console.log(`\n  Success rate: ${successRate}%`);

if (results.rateLimit > 0) {
  console.log(`\n  ⚠️  ${results.rateLimit} user(s) hit rate limits.`);
  console.log(`     Gemini free tier has per-minute quota limits.`);
  console.log(`     Consider: staggered requests, response caching, or upgrading the API plan.`);
}
if (results.error === 0 && results.rateLimit === 0) {
  console.log(`\n  All ${CONCURRENCY} users handled cleanly. No issues.\n`);
}
