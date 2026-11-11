import { prisma } from "@/lib/db";
import { isDateLocked, nextVoucherCode, writeAudit } from "@/lib/ledger";
import { vnNoon } from "@/lib/vnDate";
import { currentUserId, EntrySchema, jsonError, LOCKED_ERROR, validateEntry } from "@/lib/ledgerApi";

async function load(idParam: string) {
  const id = Number(idParam);
  if (!Number.isInteger(id)) return null;
  return prisma.ledgerEntry.findUnique({ where: { id }, include: { boxCount: { select: { id: true } } } });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const existing = await load((await ctx.params).id);
  if (!existing) return jsonError("Không tìm thấy phiếu", 404);
  if (existing.boxCount) return jsonError("Phiếu từ biên bản kiểm đếm không sửa được — hãy xoá và kiểm đếm lại", 409);
  if (await isDateLocked(existing.date)) return jsonError(LOCKED_ERROR, 409);

  const parsed = EntrySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ", 400);
  const data = parsed.data;
  if (data.type !== existing.type) return jsonError("Không đổi được loại phiếu (thu/chi)", 400);

  const problem = await validateEntry(data);
  if (problem) return jsonError(problem, problem === LOCKED_ERROR ? 409 : 400);

  const userId = await currentUserId();
  const entry = await prisma.$transaction(async (tx) => {
    // Moving the voucher into another year renumbers it in that year's sequence
    const newYear = Number(data.date.slice(0, 4));
    const code =
      Number(existing.code.slice(3, 7)) === newYear ? existing.code : await nextVoucherCode(tx, data.type, newYear);
    const updated = await tx.ledgerEntry.update({
      where: { id: existing.id },
      data: {
        code,
        date: vnNoon(data.date),
        amount: data.amount,
        categoryId: data.categoryId,
        festivalId: data.festivalId ?? null,
        party: data.party?.trim() || null,
        description: data.description,
      },
    });
    await writeAudit(tx, {
      userId,
      action: "update",
      entity: "ledger_entry",
      entityId: existing.id,
      data: { before: existing, after: updated },
    });
    return updated;
  });

  return Response.json({ entry });
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const existing = await load((await ctx.params).id);
  if (!existing) return jsonError("Không tìm thấy phiếu", 404);
  if (await isDateLocked(existing.date)) return jsonError(LOCKED_ERROR, 409);

  const userId = await currentUserId();
  await prisma.$transaction(async (tx) => {
    const boxCount = await tx.donationBoxCount.findUnique({ where: { entryId: existing.id } });
    await tx.ledgerEntry.delete({ where: { id: existing.id } }); // cascades to the box count
    await writeAudit(tx, {
      userId,
      action: "delete",
      entity: "ledger_entry",
      entityId: existing.id,
      data: { entry: existing, boxCount },
    });
  });

  return Response.json({ ok: true });
}
