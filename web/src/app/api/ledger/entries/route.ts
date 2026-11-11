import { prisma } from "@/lib/db";
import { nextVoucherCode, writeAudit } from "@/lib/ledger";
import { currentUserId, EntrySchema, jsonError, LOCKED_ERROR, validateEntry } from "@/lib/ledgerApi";
import { vnNoon } from "@/lib/vnDate";

export async function POST(req: Request) {
  const parsed = EntrySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ", 400);
  const data = parsed.data;

  const problem = await validateEntry(data);
  if (problem) return jsonError(problem, problem === LOCKED_ERROR ? 409 : 400);

  const userId = await currentUserId();
  const entry = await prisma.$transaction(async (tx) => {
    const code = await nextVoucherCode(tx, data.type, Number(data.date.slice(0, 4)));
    const created = await tx.ledgerEntry.create({
      data: {
        code,
        type: data.type,
        date: vnNoon(data.date),
        amount: data.amount,
        categoryId: data.categoryId,
        festivalId: data.festivalId ?? null,
        party: data.party?.trim() || null,
        description: data.description,
        createdById: userId,
      },
    });
    await writeAudit(tx, { userId, action: "create", entity: "ledger_entry", entityId: created.id, data: created });
    return created;
  });

  return Response.json({ entry }, { status: 201 });
}
