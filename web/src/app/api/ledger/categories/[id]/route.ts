import { z } from "zod";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/ledger";
import { currentUserId, jsonError } from "@/lib/ledgerApi";

const Schema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const id = Number((await ctx.params).id);
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!Number.isInteger(id) || !parsed.success) return jsonError("Dữ liệu không hợp lệ", 400);

  const existing = await prisma.ledgerCategory.findUnique({ where: { id } });
  if (!existing) return jsonError("Không tìm thấy danh mục", 404);
  if (existing.systemKey && parsed.data.active === false) return jsonError("Không tắt được danh mục hệ thống", 409);

  const category = await prisma.ledgerCategory.update({ where: { id }, data: parsed.data });
  await writeAudit(prisma, {
    userId: await currentUserId(),
    action: "update",
    entity: "ledger_category",
    entityId: id,
    data: { before: existing, after: category },
  });
  return Response.json({ category });
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return jsonError("Dữ liệu không hợp lệ", 400);

  const existing = await prisma.ledgerCategory.findUnique({ where: { id }, include: { _count: { select: { entries: true } } } });
  if (!existing) return jsonError("Không tìm thấy danh mục", 404);
  if (existing.systemKey) return jsonError("Không xoá được danh mục hệ thống", 409);
  if (existing._count.entries > 0) return jsonError("Danh mục đã có phiếu — hãy tắt thay vì xoá", 409);

  await prisma.ledgerCategory.delete({ where: { id } });
  await writeAudit(prisma, { userId: await currentUserId(), action: "delete", entity: "ledger_category", entityId: id, data: existing });
  return Response.json({ ok: true });
}
