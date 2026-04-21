import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

// One-time helper: create initial admin user if none exists.
// Disable by deleting this route after setup.
export async function POST() {
  const count = await prisma.user.count();
  if (count > 0) return Response.json({ ok: true, message: "Users already exist" });

  const username = process.env.INIT_ADMIN_USERNAME || "admin";
  const password = process.env.INIT_ADMIN_PASSWORD || "admin123";
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { username, passwordHash, role: "admin" },
    select: { id: true, username: true, role: true },
  });

  return Response.json({
    ok: true,
    user,
    credentials: { username, password },
  });
}

