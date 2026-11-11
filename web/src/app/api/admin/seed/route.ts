import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

// One-time helper: create initial admin user if none exists.
// The password must come from INIT_ADMIN_PASSWORD — there is no built-in default,
// so an empty database cannot be claimed with a well-known password.
export async function POST() {
  const count = await prisma.user.count();
  if (count > 0) return Response.json({ ok: true, message: "Users already exist" });

  const username = process.env.INIT_ADMIN_USERNAME || "admin";
  const password = process.env.INIT_ADMIN_PASSWORD || "";
  if (password.length < 6) {
    return Response.json(
      { error: "Set INIT_ADMIN_PASSWORD (>= 6 ký tự) trong ENV trước khi tạo admin đầu tiên" },
      { status: 400 }
    );
  }
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { username, passwordHash, role: "admin" },
    select: { id: true, username: true, role: true },
  });

  return Response.json({ ok: true, user });
}
