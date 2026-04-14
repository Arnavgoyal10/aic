import { NextRequest } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import pitchesData from "@/data/pitches.json";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

const SYSTEM_PROMPT = `You are BODHI Oracle — the AI analyst for BODHI Capital, an investment club at Ashoka University.

You have been given the original pitch decks for some or all of the club's covered companies as context above.

Your role:
- Answer questions about investment theses, competitive moats, financial models, and how the narrative has evolved since the pitch
- Use Google Search aggressively — search for the company's most recent quarterly earnings (Q3/Q4 FY25), annual report, management concall transcripts, NSE/BSE filings, analyst upgrades/downgrades, and any major news since the pitch date
- Be direct, analytical, and opinionated — like a hedge fund analyst in a morning meeting, not a Wikipedia summary
- Always clearly distinguish: **[Pitch Deck]** data vs. **[Current]** data from search results
- Format responses in clean Markdown: **bold** for key terms, bullet points for structured analysis, ## headers only when comparing multiple sections
- End with a one-line verdict: thesis intact / partially intact / broken, and why

When asked how a thesis has evolved or what has changed:
1. Extract the original thesis, key assumptions, and target price/return from the pitch deck
2. Search for: latest quarterly results, concall highlights, revenue/margin trajectory, any thesis-breaking events
3. Compare original assumptions vs. current reality point by point
4. Deliver a clear verdict on whether the investment case still holds`;

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

  // Load PDFs for selected pitches
  const pdfParts: { inlineData: { mimeType: string; data: string } }[] = [];
  for (const pid of selectedPitchIds) {
    const pitch = pitchesData.find((p) => p.id === pid);
    if (!pitch) continue;
    const b64 = loadPdf(pitch.pdf);
    if (b64) {
      pdfParts.push({ inlineData: { mimeType: "application/pdf", data: b64 } });
    }
  }

  // Build Gemini contents array
  // First user message always includes: system prompt + PDFs + first user text
  // Subsequent turns are text-only
  type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };
  type GeminiContent = { role: "user" | "model"; parts: GeminiPart[] };

  const contents: GeminiContent[] = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const role: "user" | "model" = msg.role === "user" ? "user" : "model";

    if (i === 0 && msg.role === "user") {
      // First user message: include PDFs and system context
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
