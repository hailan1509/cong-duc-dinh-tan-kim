import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getAdminCookieName, verifyAdminToken } from "@/lib/adminSession";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api");

  // Public paths
  if (pathname === "/") return NextResponse.next();
  if (pathname.startsWith("/api/public/")) return NextResponse.next();

  // Let Next handle static files and internals
  if (pathname.startsWith("/_next/")) return NextResponse.next();
  if (pathname === "/favicon.ico") return NextResponse.next();

  if (pathname === "/admin/login") return NextResponse.next();
  if (pathname === "/admin/forbidden") return NextResponse.next();
  if (pathname === "/api/admin/login") return NextResponse.next();
  if (pathname === "/api/admin/seed") return NextResponse.next();
  if (pathname === "/api/admin/logout") return NextResponse.next();

  const cookie = req.cookies.get(getAdminCookieName())?.value;

  return (async () => {
    const session = await verifyAdminToken(cookie);
    if (session.ok) {
      if (session.role === "admin") return NextResponse.next();

      // staff permissions:
      // - view merit list: /admin/cong-duc
      // - add merit: /cong-duc/them
      // - create/list merits API: GET/POST /api/merits
      if (pathname === "/cong-duc/them") return NextResponse.next();
      if (pathname === "/admin/cong-duc") return NextResponse.next();

      if (pathname === "/api/merits") {
        if (req.method === "GET" || req.method === "POST") return NextResponse.next();
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Everything else is admin-only
      if (isApi) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      const url = req.nextUrl.clone();
      url.pathname = "/admin/forbidden";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    if (isApi) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  })();
}

export const config = {
  matcher: ["/:path*"],
};

