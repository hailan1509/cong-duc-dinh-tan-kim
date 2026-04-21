import { prisma } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const userId = Number(id);
  if (!Number.isFinite(userId)) return Response.json({ error: "Invalid id" }, { status: 400 });

  await prisma.user.delete({ where: { id: userId } });
  return Response.json({ ok: true });
}

const ResetSchema = z.object({
  password: z.string().min(6).max(200),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const userId = Number(id);
  if (!Number.isFinite(userId)) return Response.json({ error: "Invalid id" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const parsed = ResetSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid payload" }, { status: 400 });

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  return Response.json({ ok: true });
}

