import { NextRequest } from "next/server";
import admin from "@/lib/firebaseAdmin";

export async function POST(request: NextRequest) {
  try {
    const { message, senderToken } = await request.json();
    if (!message) return Response.json({ sent: 0 });

    const db = admin.database();
    const snapshot = await db.ref("pit/fcm_tokens").get();
    if (!snapshot.exists()) return Response.json({ sent: 0 });

    const tokens: string[] = [];
    const keyMap: Record<string, string> = {}; // token → db key
    snapshot.forEach((child) => {
      const data = child.val();
      if (data?.token && data.token !== senderToken) {
        tokens.push(data.token);
        keyMap[data.token] = child.key as string;
      }
    });

    if (tokens.length === 0) return Response.json({ sent: 0 });

    const result = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title: "The Pit 💬", body: message },
      webpush: {
        notification: { icon: "/bodhi.png", tag: "the-pit", badge: "/bodhi.png" },
      },
    });

    // Clean up stale tokens
    const staleRemovals: Promise<void>[] = [];
    result.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const code = resp.error?.code ?? "";
        if (code.includes("not-registered") || code.includes("invalid-argument")) {
          staleRemovals.push(db.ref(`pit/fcm_tokens/${keyMap[tokens[idx]]}`).remove());
        }
      }
    });
    await Promise.all(staleRemovals);

    return Response.json({ sent: result.successCount });
  } catch (err) {
    console.error("[pit/notify]", err);
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}
