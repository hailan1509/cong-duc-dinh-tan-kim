import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await prisma.appSetting.findUnique({ where: { id: 1 } });
  return Response.json({
    setting: s
      ? {
          ttsEnabled: s.ttsEnabled,
          ttsProvider: s.ttsProvider,
          fptVoice: s.fptVoice,
          fptSpeed: s.fptSpeed,
          fptFormat: s.fptFormat,
        }
      : {
          ttsEnabled: false,
          ttsProvider: "fpt",
          fptVoice: "banmai",
          fptSpeed: 0,
          fptFormat: "mp3",
        },
    hasFptKey: !!process.env.FPT_AI_TTS_API_KEY,
  });
}

