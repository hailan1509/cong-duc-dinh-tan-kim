import { prisma } from "@/lib/db";
import { z } from "zod";

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const meritId = Number(id);
  if (!Number.isFinite(meritId)) return Response.json({ error: "Invalid id" }, { status: 400 });

  await prisma.merit.delete({ where: { id: meritId } });
  return Response.json({ ok: true });
}

const MeritUpdateSchema = z.object({
  donorName: z.string().min(1).optional(),
  donorAddress: z.string().min(1).optional(),
  amount: z.coerce.number().int().min(0).optional(),
  note: z.string().optional().nullable(),
  festivalId: z.coerce.number().int().positive().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const meritId = Number(id);
  if (!Number.isFinite(meritId)) return Response.json({ error: "Invalid id" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const parsed = MeritUpdateSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid payload" }, { status: 400 });

  const merit = await prisma.merit.update({
    where: { id: meritId },
    data: {
      ...parsed.data,
      note: parsed.data.note === undefined ? undefined : parsed.data.note || null,
    },
  });

  return Response.json({ merit });
}

