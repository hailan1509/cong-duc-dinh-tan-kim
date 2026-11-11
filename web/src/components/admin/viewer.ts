import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getAdminCookieName, verifyAdminToken } from "@/lib/adminSession";

export type AdminViewer = { role: "admin" | "staff"; username: string };

/** Who is logged in — used only to render the admin shell (menu + user box). */
export async function getAdminViewer(): Promise<AdminViewer | null> {
  const token = (await cookies()).get(getAdminCookieName())?.value;
  const session = await verifyAdminToken(token);
  if (!session.ok) return null;

  const user = await prisma.user
    .findUnique({ where: { id: session.userId }, select: { username: true } })
    .catch(() => null);

  return { role: session.role, username: user?.username ?? "Tài khoản" };
}
