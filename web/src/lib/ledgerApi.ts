import { z } from "zod";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getAdminCookieName, verifyAdminToken } from "@/lib/adminSession";
import { getLedgerSettings, isDateLocked } from "@/lib/ledger";
import { isValidDateKey, vnNoon } from "@/lib/vnDate";

/** Middleware already restricts /api/ledger/* to admins; this returns who is acting (for the audit log). */
export async function currentUserId() {
  const session = await verifyAdminToken((await cookies()).get(getAdminCookieName())?.value);
  return session.ok ? session.userId : null;
}

export const LOCKED_ERROR = "Tháng này đã khoá sổ. Mở khoá trong Báo cáo năm nếu cần sửa.";

export function jsonError(error: string, status: number) {
  return Response.json({ error }, { status });
}

export { DENOMINATIONS } from "@/lib/ledgerConst";

export const EntrySchema = z.object({
  type: z.enum(["thu", "chi"]),
  date: z.string().refine(isValidDateKey, "Ngày không hợp lệ"),
  amount: z.coerce.number().int().positive().max(100_000_000_000),
  categoryId: z.coerce.number().int().positive(),
  festivalId: z.coerce.number().int().positive().nullable().optional(),
  party: z.string().max(200).nullable().optional(),
  description: z.string().trim().min(1).max(2000),
});

/** Shared validation for create/update: category type, start date, lock. */
export async function validateEntry(data: z.infer<typeof EntrySchema>) {
  const category = await prisma.ledgerCategory.findUnique({ where: { id: data.categoryId } });
  if (!category || category.type !== data.type) return "Danh mục không hợp lệ";
  if (category.systemKey === "hom_cong_duc") return "Tiền hòm công đức phải nhập qua chức năng Kiểm đếm hòm";
  const settings = await getLedgerSettings();
  if (settings.startKey && data.date < settings.startKey) return `Ngày phải từ ngày bắt đầu sổ (${settings.startKey})`;
  if (await isDateLocked(vnNoon(data.date))) return LOCKED_ERROR;
  return null;
}

