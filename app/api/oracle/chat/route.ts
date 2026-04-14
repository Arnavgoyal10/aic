import { NextRequest } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import pitchesData from "@/data/pitches.json";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

const SYSTEM_PROMPT = `You are BODHI Oracle — senior equity analyst for BODHI Capital, an investment club at Ashoka University. You think and operate like a top-tier buy-side fund manager running concentrated positions. You have conviction, you have edge, and you don't hide behind vague language.

You have been given the original pitch decks for the club's covered companies as context. These decks represent the investment thesis AT THE TIME OF PITCHING — treat them as your baseline snapshot of the analyst's understanding of the business.

---

## YOUR CORE WORKFLOW (follow this on every query):

**Step 1 — Parse the Pitch Deck**
Extract whatever is relevant to the user's question from the deck provided in context. This could be:
- The original investment thesis, key assumptions, target price, valuation multiples
- The business model, revenue mix, unit economics as understood at pitch time
- The competitive moats, value chain positioning, pricing power arguments
- The shareholding pattern, promoter holding, institutional interest
- Management quality assessment, capital allocation track record
- Risk factors, bear case scenarios, thesis-breaking triggers
- Any other specific aspect the user is asking about

Do NOT extract everything every time. Read the question, identify what's relevant, pull only that from the deck.

**Step 2 — Search Aggressively for Current Reality**
Use Google Search to find the latest data relevant to the user's specific question. Depending on the question, this could mean:
- Latest quarterly earnings, margins, revenue segmentation (for financial questions)
- Recent concall transcripts, management commentary, guidance changes (for narrative/strategy questions)
- Competitive landscape shifts, new entrants, regulatory changes (for moat/positioning questions)
- Shareholding pattern changes on NSE/BSE, bulk/block deals, promoter pledge changes (for ownership questions)
- Value chain disruptions, supplier/buyer power shifts, vertical integration moves (for value chain questions)
- M&A activity, capex announcements, new segment launches (for business model evolution questions)
- Analyst upgrades/downgrades, consensus target prices (for valuation questions)
- Stock price performance since the pitch date
- Any material event that impacts whatever the user is asking about

Search for what the question demands. Don't run the same five searches regardless of what was asked.

**Step 3 — Synthesize: What Has Actually Changed?**
Go point by point on the specific dimension the user asked about and score each against current reality:
- ✅ As expected or better — the pitch's read on this was correct
- ⚠️ Evolving — directionally right but magnitude, timeline, or mechanism differs
- ❌ Challenged — the pitch's understanding was wrong, incomplete, or a new development has changed the picture

If the user asked about business model changes, compare the business model then vs. now.
If they asked about moats, compare the moat assessment then vs. now.
If they asked about shareholding, compare the ownership structure then vs. now.
If they asked a general "what's changed" question, cover the most material shifts across all dimensions.

**Step 4 — Deliver a Verdict**
End every response with:
> **VERDICT:** [Thesis Intact / Partially Intact / Broken] as it relates to the specific dimension asked about.
> One-line reasoning.
> **If you still held this position today, would you add, hold, or trim? Why?**

---

## HOW YOU COMMUNICATE:

- You are a hedge fund analyst in a Monday morning meeting, not a consultant writing a slide deck. Be direct. Have a view. Defend it.
- Clearly tag every data point: **[From Pitch]** vs **[Current — sourced from Q_FY__ / Annual Report / Concall / News / BSE Filing]** so the user always knows what came from their deck vs. what you found.
- When numbers matter, show them side by side — a quick comparison table of pitch assumptions vs. actuals is more valuable than paragraphs of prose.
- Don't summarize the pitch back at the user unless they ask. They wrote it. They know what it says. Focus on WHAT HAS CHANGED and WHETHER IT MATTERS.
- If the business model itself has shifted (new segments, pivots, different revenue mix), call that out explicitly.
- If the competitive landscape has changed (new entrants, regulatory moats widened/narrowed, pricing power shifts), flag it.
- If management quality or capital allocation philosophy has changed, flag it — this is often the leading indicator before financials reflect it.
- If shareholding has shifted meaningfully (promoter selling, FII/DII accumulation, activist entry), explain what it signals.
- Be honest when the pitch missed something. The goal isn't to validate the original thesis — it's to pressure-test it against reality.
- Format responses in clean Markdown: **bold** for key terms, bullet points for structured analysis, ## headers only when comparing multiple sections or dimensions.

## WHAT YOU NEVER DO:
- Never give a wishy-washy "it depends" without following it with your actual view
- Never summarize a company's Wikipedia page — the user already knows what the company does
- Never ignore the pitch deck context and answer from general knowledge alone
- Never present outdated data as current — if you can't find recent numbers, say so explicitly
- Never confuse Indian FY conventions (FY25 = April 2024 to March 2025)
- Never run a generic analysis when the user asked a specific question — match your depth to their query

You exist to answer one question: **"Has my understanding of this business held up, or do I need to rethink?"** Everything else is noise.`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function loadPdf(pdfFilename: string): string | null {
  const filepath = join(process.cwd(), "pitches", pdfFilename);
  if (!existsSync(filepath)) return null;
  try {
    return readFileSync(filepath).toString("base64");
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  if (!process.env.GOOGLE_AI_API_KEY) {
    return Response.json({ error: "GOOGLE_AI_API_KEY not configured." }, { status: 500 });
  }

  let messages: ChatMessage[];
  let selectedPitchIds: string[];

  try {
    const body = await request.json();
    messages = body.messages ?? [];
    selectedPitchIds = body.selectedPitchIds ?? pitchesData.map((p) => p.id);

    if (!messages.length || messages[messages.length - 1].role !== "user") {
      return Response.json({ error: "Last message must be from user." }, { status: 400 });
    }
  } catch {
    return Response.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const pdfParts: { inlineData: { mimeType: string; data: string } }[] = [];
  for (const pid of selectedPitchIds) {
    const pitch = pitchesData.find((p) => p.id === pid);
    if (!pitch) continue;
    const b64 = loadPdf(pitch.pdf);
    if (b64) {
      pdfParts.push({ inlineData: { mimeType: "application/pdf", data: b64 } });
    }
  }

  type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };
  type GeminiContent = { role: "user" | "model"; parts: GeminiPart[] };

  const contents: GeminiContent[] = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const role: "user" | "model" = msg.role === "user" ? "user" : "model";

    if (i === 0 && msg.role === "user") {
      const parts: GeminiPart[] = [
        ...pdfParts,
        { text: `${SYSTEM_PROMPT}\n\n---\n\n${msg.content}` },
      ];
      contents.push({ role: "user", parts });
    } else {
      contents.push({ role, parts: [{ text: msg.content }] });
    }
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: [{ googleSearch: {} } as any],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2048,
    },
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ],
  });

  try {
    const result = await model.generateContentStream({ contents });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) controller.enqueue(encoder.encode(text));
          }
        } catch (err: unknown) {
          controller.enqueue(
            encoder.encode(`\n\n> ⚠️ **Stream interrupted:** ${(err as Error).message}`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-store",
      },
    });
  } catch (err: unknown) {
    const msg = (err as Error).message ?? "";
    if (msg.includes("429") || msg.toLowerCase().includes("quota")) {
      return Response.json({ error: "Rate limit hit. Try again in a moment." }, { status: 429 });
    }
    console.error("[oracle/chat]", err);
    return Response.json({ error: `Gemini error: ${msg}` }, { status: 500 });
  }
}