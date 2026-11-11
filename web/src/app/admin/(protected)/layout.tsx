import AdminShell from "@/components/admin/AdminShell";
import { getAdminViewer } from "@/components/admin/viewer";

export const dynamic = "force-dynamic";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getAdminViewer();
  return <AdminShell viewer={viewer}>{children}</AdminShell>;
}
