import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getAdminCookieName, verifyAdminToken } from "@/lib/adminSession";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");
  if (!isAdminPage && !isAdminApi) return NextResponse.next();

  if (pathname === "/admin/login") return NextResponse.next();
  if (pathname === "/api/admin/login") return NextResponse.next();
  if (pathname === "/api/admin/seed") return NextResponse.next();
  if (pathname === "/api/admin/logout") return NextResponse.next();

  const cookie = req.cookies.get(getAdminCookieName())?.value;

  return (async () => {
    const session = await verifyAdminToken(cookie);
    if (session.ok && session.role === "admin") return NextResponse.next();

    if (isAdminApi) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  })();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

