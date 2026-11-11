import { z } from "zod";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/ledger";
import { currentUserId, jsonError } from "@/lib/ledgerApi";
import { isValidDateKey, vnStartOfDay } from "@/lib/vnDate";

const Schema = z.object({
  openingBalance: z.coerce.number().int().min(0).max(100_000_000_000),
  startDate: z.string().refine(isValidDateKey).nullable(),
  isPublic: z.boolean(),
});

export async function PUT(req: Request) {
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Dữ liệu không hợp lệ", 400);
  const { openingBalance, startDate, isPublic } = parsed.data;

  // Changing the opening balance/start rewrites every balance — refuse once any month is locked
  const before = await prisma.appSetting.findUnique({ where: { id: 1 } });
  const startChanged =
    (before?.ledgerStartDate?.getTime() ?? null) !== (startDate ? vnStartOfDay(startDate).getTime() : null) ||
    (before?.ledgerOpeningBalance ?? 0) !== openingBalance;
  if (startChanged && (await prisma.ledgerPeriodLock.count()) > 0) {
    return jsonError("Đã có tháng khoá sổ — mở khoá hết trước khi đổi số dư đầu kỳ / ngày bắt đầu", 409);
  }

  const data = {
    ledgerOpeningBalance: openingBalance,
    ledgerStartDate: startDate ? vnStartOfDay(startDate) : null,
    ledgerPublic: isPublic,
  };
  const setting = await prisma.appSetting.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });
  await writeAudit(prisma, { userId: await currentUserId(), action: "update", entity: "ledger_settings", data });
  return Response.json({ ok: true, setting: { openingBalance, startDate, isPublic: setting.ledgerPublic } });
}
