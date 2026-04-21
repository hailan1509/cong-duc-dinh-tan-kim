import { getAdminCookieName } from "@/lib/adminSession";

export async function POST() {
  const res = Response.json({ ok: true });
  res.headers.append(
    "Set-Cookie",
    `${getAdminCookieName()}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`
  );
  return res;
}

