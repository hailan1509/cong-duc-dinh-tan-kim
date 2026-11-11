import { prisma } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { getAdminCookieName, verifyAdminToken } from "@/lib/adminSession";

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const userId = Number(id);
  if (!Number.isFinite(userId)) return Response.json({ error: "Invalid id" }, { status: 400 });

  // Never leave the system without an admin (deleting yourself or the last admin locks everyone out).
  const session = await verifyAdminToken((await cookies()).get(getAdminCookieName())?.value);
  if (session.ok && session.userId === userId) {
    return Response.json({ error: "Không thể xoá tài khoản đang đăng nhập" }, { status: 409 });
  }
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!target) return Response.json({ error: "User không tồn tại" }, { status: 404 });
  if (target.role === "admin") {
    const admins = await prisma.user.count({ where: { role: "admin" } });
    if (admins <= 1) return Response.json({ error: "Không thể xoá admin cuối cùng" }, { status: 409 });
  }

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

