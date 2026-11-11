import { prisma } from "@/lib/db";
import { z } from "zod";
import { cookies } from "next/headers";
import { getAdminCookieName, verifyAdminToken } from "@/lib/adminSession";

export const dynamic = "force-dynamic";

const ReqSchema = z.object({
  text: z.string().min(3).max(5000),
});

// Simple in-memory cache: text+voice+speed+format -> asyncUrl
const globalForCache = globalThis as unknown as {
  __cdtk_tts_cache?: Map<string, { url: string; at: number }>;
};

function cache() {
  if (!globalForCache.__cdtk_tts_cache) globalForCache.__cdtk_tts_cache = new Map();
  return globalForCache.__cdtk_tts_cache;
}

// Fixed phrases spoken by the public board (MeritBoard.tsx)
const BOARD_PHRASES = new Set(["Xin chào. Đây là thử loa công đức.", "Đã bật loa thông báo công đức"]);
const ANNOUNCE_WINDOW_MS = 1000 * 60 * 30;

async function isLoggedIn() {
  const token = (await cookies()).get(getAdminCookieName())?.value;
  return (await verifyAdminToken(token)).ok;
}

/** True when `text` is the board's announcement of a merit created in the last 30 minutes. */
async function isBoardAnnouncement(text: string) {
  if (BOARD_PHRASES.has(text)) return true;
  if (!text.includes("phát tâm công đức")) return false;

  const digits = text.replace(/\D/g, "");
  const recent = await prisma.merit.findMany({
    where: { announce: true, createdAt: { gte: new Date(Date.now() - ANNOUNCE_WINDOW_MS) } },
    select: { donorName: true, amount: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return recent.some(
    (m) =>
      text.includes(m.donorName.trim()) &&
      digits.includes(String(m.amount)) &&
      // honorific + name + "phát tâm công đức" + formatted amount + "đồng" — no room for extra payload
      text.length <= m.donorName.length + 80
  );
}

export async function POST(req: Request) {
  const apiKey = process.env.FPT_AI_TTS_API_KEY;
  if (!apiKey) return Response.json({ error: "Missing FPT_AI_TTS_API_KEY" }, { status: 500 });

  const body = await req.json().catch(() => null);
  const parsed = ReqSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid payload" }, { status: 400 });

  const setting = await prisma.appSetting.findUnique({ where: { id: 1 } });
  const enabled = setting?.ttsEnabled ?? false;
  const provider = setting?.ttsProvider ?? "fpt";
  if (!enabled || provider !== "fpt") return Response.json({ error: "TTS disabled" }, { status: 409 });

  const voice = setting?.fptVoice ?? "banmai";
  const speed = String(setting?.fptSpeed ?? 0);
  const format = setting?.fptFormat ?? "mp3";

  const text = parsed.data.text;
  const key = `${voice}|${speed}|${format}|${text}`;
  const hit = cache().get(key);
  if (hit && Date.now() - hit.at < 1000 * 60 * 60) {
    return Response.json({ url: hit.url, cached: true });
  }

  // Anonymous callers (the public board) may only synthesize what the board itself speaks;
  // otherwise anyone could spend the FPT.AI quota with arbitrary text.
  if (!(await isLoggedIn()) && !(await isBoardAnnouncement(text))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const res = await fetch("https://api.fpt.ai/hmi/tts/v5", {
    method: "POST",
    headers: {
      api_key: apiKey,
      voice,
      speed,
      format,
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    },
    body: text,
  });

  const data = (await res.json().catch(() => null)) as
    | { async?: string; error?: number; message?: string }
    | null;

  if (!res.ok || !data || data.error !== 0 || !data.async) {
    return Response.json(
      { error: data?.message ?? "FPT.AI TTS failed" },
      { status: 502 }
    );
  }

  cache().set(key, { url: data.async, at: Date.now() });
  return Response.json({ url: data.async, cached: false });
}

