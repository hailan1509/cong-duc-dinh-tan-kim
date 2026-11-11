import { getAdminCookieName, secureCookieAttr } from "@/lib/adminSession";

export async function POST(req: Request) {
  const res = Response.json({ ok: true });
  res.headers.append(
    "Set-Cookie",
    `${getAdminCookieName()}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secureCookieAttr(req)}`
  );
  return res;
}

