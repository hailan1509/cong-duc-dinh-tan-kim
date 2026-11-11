import { z } from "zod";
import { prisma } from "@/lib/db";
import { BOX_CATEGORY_KEY, ensureDefaultCategories, getLedgerSettings, isDateLocked, nextVoucherCode, writeAudit } from "@/lib/ledger";
import { isValidDateKey, vnNoon } from "@/lib/vnDate";
import { currentUserId, DENOMINATIONS, jsonError, LOCKED_ERROR } from "@/lib/ledgerApi";

const Schema = z.object({
  date: z.string().refine(isValidDateKey, "Ngày không hợp lệ"),
  location: z.string().trim().min(1).max(200),
  denominations: z
    .array(z.object({ value: z.number().int().refine((v) => DENOMINATIONS.includes(v)), count: z.number().int().min(0).max(1_000_000) }))
    .max(DENOMINATIONS.length),
  participants: z.string().trim().min(1, "Cần ghi người tham gia kiểm đếm").max(2000),
  festivalId: z.coerce.number().int().positive().nullable().optional(),
  note: z.string().max(2000).nullable().optional(),
});

export async function POST(req: Request) {
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ", 400);
  const data = parsed.data;

  const denominations = data.denominations.filter((d) => d.count > 0).sort((a, b) => b.value - a.value);
  const total = denominations.reduce((s, d) => s + d.value * d.count, 0);
  if (total <= 0) return jsonError("Tổng tiền kiểm đếm phải lớn hơn 0", 400);

  const settings = await getLedgerSettings();
  if (settings.startKey && data.date < settings.startKey) return jsonError(`Ngày phải từ ngày bắt đầu sổ (${settings.startKey})`, 400);
  if (await isDateLocked(vnNoon(data.date))) return jsonError(LOCKED_ERROR, 409);

  await ensureDefaultCategories();
  const category = await prisma.ledgerCategory.findUnique({ where: { systemKey: BOX_CATEGORY_KEY } });
  if (!category) return jsonError("Thiếu danh mục Hòm công đức", 500);

  const userId = await currentUserId();
  const result = await prisma.$transaction(async (tx) => {
    const code = await nextVoucherCode(tx, "thu", Number(data.date.slice(0, 4)));
    const entry = await tx.ledgerEntry.create({
      data: {
        code,
        type: "thu",
        date: vnNoon(data.date),
        amount: total,
        categoryId: category.id,
        festivalId: data.festivalId ?? null,
        party: null,
        description: `Kiểm đếm hòm công đức — ${data.location}`,
        createdById: userId,
      },
    });
    const boxCount = await tx.donationBoxCount.create({
      data: {
        entryId: entry.id,
        countedAt: new Date(),
        location: data.location,
        denominations,
        total,
        participants: data.participants,
        note: data.note?.trim() || null,
      },
    });
    await writeAudit(tx, { userId, action: "create", entity: "box_count", entityId: boxCount.id, data: { entry, boxCount } });
    return { entry, boxCount };
  });

  return Response.json(result, { status: 201 });
}
