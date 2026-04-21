import { prisma } from "@/lib/db";
import { z } from "zod";

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

