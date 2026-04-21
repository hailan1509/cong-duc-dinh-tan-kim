import { prisma } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET() {
  const s =
    (await prisma.appSetting.findUnique({ where: { id: 1 } })) ??
    (await prisma.appSetting.create({ data: { id: 1 } }));
  return Response.json({ setting: s });
}

const UpdateSchema = z.object({
  ttsEnabled: z.coerce.boolean(),
  ttsProvider: z.enum(["webspeech", "fpt"]),
  fptVoice: z.string().min(1),
  fptSpeed: z.coerce.number().int().min(-3).max(3),
  fptFormat: z.enum(["mp3", "wav"]),
});

export async function PUT(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid payload" }, { status: 400 });

  const s = await prisma.appSetting.upsert({
    where: { id: 1 },
    create: { id: 1, ...parsed.data },
    update: parsed.data,
  });

  return Response.json({ setting: s });
}

