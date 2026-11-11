import { z } from "zod";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/ledger";
import { currentUserId, jsonError } from "@/lib/ledgerApi";

const Schema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  locked: z.boolean(),
});

export async function POST(req: Request) {
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Dữ liệu không hợp lệ", 400);
  const { year, month, locked } = parsed.data;
  const userId = await currentUserId();

  if (locked) {
    await prisma.ledgerPeriodLock.upsert({
      where: { year_month: { year, month } },
      create: { year, month, lockedById: userId },
      update: {},
    });
  } else {
    await prisma.ledgerPeriodLock.deleteMany({ where: { year, month } });
  }
  await writeAudit(prisma, { userId, action: locked ? "lock" : "unlock", entity: "ledger_period", data: { year, month } });
  return Response.json({ ok: true, year, month, locked });
}
