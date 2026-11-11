import { z } from "zod";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/ledger";
import { currentUserId, jsonError } from "@/lib/ledgerApi";

const Schema = z.object({
  type: z.enum(["thu", "chi"]),
  name: z.string().trim().min(1).max(100),
});

export async function POST(req: Request) {
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Dữ liệu không hợp lệ", 400);

  const max = await prisma.ledgerCategory.aggregate({ _max: { sortOrder: true } });
  const category = await prisma.ledgerCategory.create({
    data: { type: parsed.data.type, name: parsed.data.name, sortOrder: (max._max.sortOrder ?? 0) + 1 },
  });
  await writeAudit(prisma, { userId: await currentUserId(), action: "create", entity: "ledger_category", entityId: category.id, data: category });
  return Response.json({ category }, { status: 201 });
}
