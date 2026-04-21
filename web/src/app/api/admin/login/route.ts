import { z } from "zod";

import { prisma } from "@/lib/db";
import { createAdminToken, getAdminCookieName } from "@/lib/adminSession";
import bcrypt from "bcryptjs";

const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid payload" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (!user) return Response.json({ error: "Sai tài khoản hoặc mật khẩu" }, { status: 401 });

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) return Response.json({ error: "Sai tài khoản hoặc mật khẩu" }, { status: 401 });
  if (user.role !== "admin") return Response.json({ error: "Không có quyền admin" }, { status: 403 });

  const token = await createAdminToken({ userId: user.id, role: user.role });
  const res = Response.json({ ok: true });
  res.headers.append(
    "Set-Cookie",
    `${getAdminCookieName()}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax`
  );
  return res;
}

