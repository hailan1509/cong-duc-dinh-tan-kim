import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminCookieName, verifyAdminToken } from "@/lib/adminSession";
import LoginClient from "./LoginClient";

export default async function LoginPage() {
  const token = (await cookies()).get(getAdminCookieName())?.value;
  const session = await verifyAdminToken(token);
  if (session.ok) redirect("/admin/cong-duc");

  return <LoginClient />;
}

