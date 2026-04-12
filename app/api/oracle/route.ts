import { NextRequest } from "next/server";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

const MAX_PDF_BYTES = 15 * 1024 * 1024; // 15 MB inline limit
const FETCH_TIMEOUT_MS = 20_000;

function buildPrompt(ticker: string): string {
  return `You are an elite hedge fund portfolio manager conducting a rigorous post-mortem analysis.

Attached is a pitch deck for **${ticker}**.

## Your Instructions:

**Step 1 — Extract the Original Thesis**
Read the pitch deck carefully. Extract:
- The core bullish investment thesis (2–4 bullet points)
- The stated target price and time horizon
- Key assumptions the bull case rests on

**Step 2 — Ground Truth Check (Use Google Search)**
Search for the following about ${ticker} from the past 6 months:
- Recent earnings results vs. expectations
- Material news events (management changes, regulatory actions, M&A)
- Sector and macroeconomic tailwinds or headwinds
- Analyst consensus changes and price target revisions

**Step 3 — Thesis Verdict**
Based on Steps 1 and 2, deliver a clear verdict:

Choose exactly one: **THESIS INTACT** | **THESIS BROKEN** | **NEEDS REVISION**

Then explain:
- Which specific assumptions held or broke
- What the key risk or catalyst to watch is now
- Whether you would still hold, add, reduce, or exit this position today

---

Be concise, analytical, and brutally honest. Format your response in clean Markdown with headers (##) and bullet points. No padding or filler.`;
}

export async function POST(request: NextRequest) {
  // ── 1. Parse and validate input ──────────────────────────────
  let pdfUrl: string;
  let ticker: string;

  try {
    const body = await request.json();
    pdfUrl = (body.pdfUrl ?? "").trim();
    ticker = (body.ticker ?? "").trim().toUpperCase();

    if (!pdfUrl || !ticker) {
      return Response.json(
        { error: "Both pdfUrl and ticker are required." },
        { status: 400 }
      );
    }
    new URL(pdfUrl); // validate URL structure
  } catch {
    return Response.json(
      { error: "Invalid request payload or malformed PDF URL." },
      { status: 400 }
    );
  }

  if (!process.env.GOOGLE_AI_API_KEY) {
    return Response.json(
      { error: "GOOGLE_AI_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  // ── 2. Fetch the PDF and encode as Base64 ─────────────────────
  let pdfBase64: string;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const pdfResponse = await fetch(pdfUrl, {
      signal: controller.signal,
      headers: { Accept: "application/pdf,*/*" },
    });
    clearTimeout(timeout);

    if (!pdfResponse.ok) {
      return Response.json(
        { error: `Could not fetch PDF: HTTP ${pdfResponse.status}.` },
        { status: 502 }
      );
    }

    const buffer = await pdfResponse.arrayBuffer();

    if (buffer.byteLength > MAX_PDF_BYTES) {
      return Response.json(
        {
          error: `PDF is ${(buffer.byteLength / 1024 / 1024).toFixed(1)} MB — exceeds the 15 MB inline limit.`,
        },
        { status: 413 }
      );
    }

    pdfBase64 = Buffer.from(buffer).toString("base64");
  } catch (err: unknown) {
    const msg = (err as Error).message ?? "";
    if (msg.includes("abort") || msg.includes("timeout")) {
      return Response.json({ error: "PDF fetch timed out." }, { status: 504 });
    }
    return Response.json(
      { error: `Failed to fetch PDF: ${msg}` },
      { status: 502 }
    );
  }

  // ── 3. Configure Gemini with Search Grounding ─────────────────
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: [{ googleSearch: {} } as any],
    generationConfig: {
      temperature: 0.2,       // low temp → analytical, not creative
      maxOutputTokens: 2048,
    },
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ],
  });

  // ── 4. Build content request with PDF inlineData ─────────────
  const geminiRequest = {
    contents: [
      {
        role: "user" as const,
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf" as const,
              data: pdfBase64,
            },
          },
          { text: buildPrompt(ticker) },
        ],
      },
    ],
  };

  // ── 5. Stream response back to client ────────────────────────
  try {
    const result = await model.generateContentStream(geminiRequest);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) controller.enqueue(encoder.encode(text));
          }
        } catch (streamErr: unknown) {
          // Surface stream interruptions as inline markdown rather than crashing
          const errMsg = (streamErr as Error).message ?? "Stream interrupted";
          controller.enqueue(
            encoder.encode(`\n\n> ⚠️ **Analysis interrupted:** ${errMsg}`)
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
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err: unknown) {
    const msg = (err as Error).message ?? "";

    if (msg.includes("429") || msg.toLowerCase().includes("quota")) {
      return Response.json(
        { error: "Gemini rate limit hit. Wait a few seconds and try again." },
        { status: 429 }
      );
    }
    if (msg.includes("API_KEY") || msg.includes("credentials")) {
      return Response.json(
        { error: "Invalid Gemini API key. Check GOOGLE_AI_API_KEY in .env.local." },
        { status: 401 }
      );
    }

    console.error("[oracle API]", err);
    return Response.json({ error: `Gemini error: ${msg}` }, { status: 500 });
  }
}
