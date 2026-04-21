import { prisma } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { id: "asc" },
    select: { id: true, username: true, role: true, createdAt: true, updatedAt: true },
  });
  return Response.json({ users });
}

const UserCreateSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(200),
  role: z.enum(["admin", "staff"]).optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = UserCreateSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid payload" }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (existing) return Response.json({ error: "Username đã tồn tại" }, { status: 409 });

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: {
      username: parsed.data.username,
      passwordHash,
      role: parsed.data.role ?? "admin",
    },
    select: { id: true, username: true, role: true, createdAt: true, updatedAt: true },
  });

  return Response.json({ user }, { status: 201 });
}

