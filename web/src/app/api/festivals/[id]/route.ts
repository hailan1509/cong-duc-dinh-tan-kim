import { prisma } from "@/lib/db";
import { z } from "zod";

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const festivalId = Number(id);
  if (!Number.isFinite(festivalId)) return Response.json({ error: "Invalid id" }, { status: 400 });

  const count = await prisma.merit.count({ where: { festivalId } });
  if (count > 0) {
    return Response.json(
      { error: "Không thể xoá: ngày lễ đã có công đức" },
      { status: 409 }
    );
  }

  await prisma.festival.delete({ where: { id: festivalId } });
  return Response.json({ ok: true });
}

const FestivalUpdateSchema = z.object({
  name: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  year: z.coerce.number().int().min(1900).max(3000),
  active: z.coerce.boolean().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const festivalId = Number(id);
  if (!Number.isFinite(festivalId)) return Response.json({ error: "Invalid id" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const parsed = FestivalUpdateSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid payload" }, { status: 400 });

  if (parsed.data.active === false) {
    const cur = await prisma.festival.findUnique({ where: { id: festivalId }, select: { active: true } });
    if (cur?.active) {
      return Response.json({ error: "Không thể bỏ active trực tiếp. Hãy active 1 ngày lễ khác." }, { status: 409 });
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (parsed.data.active) {
      await tx.festival.updateMany({ data: { active: false }, where: { active: true } });
    }
    return await tx.festival.update({
      where: { id: festivalId },
      data: {
        name: parsed.data.name,
        startDate: new Date(parsed.data.startDate),
        endDate: new Date(parsed.data.endDate),
        year: parsed.data.year,
        active: parsed.data.active ?? undefined,
      },
    });
  });

  return Response.json({ festival: updated });
}

