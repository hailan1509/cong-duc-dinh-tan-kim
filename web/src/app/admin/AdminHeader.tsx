"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import AdminLogoutButton from "./AdminLogoutButton";

type Item = { href: string; label: string };

export default function AdminHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const items = useMemo<Item[]>(
    () => [
      { href: "/", label: "Trang chủ" },
      { href: "/admin/cong-duc", label: "Công đức" },
      { href: "/admin/ngay-le", label: "Ngày lễ" },
      { href: "/admin/users", label: "User" },
      { href: "/admin/tts", label: "Giọng đọc" },
    ],
    []
  );

  useEffect(() => {
    // Close menu on navigation
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-[#8b0000]/15 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="font-extrabold tracking-tight text-[#8b0000]">
            Công đức đình Tân Kim
          </Link>

          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <AdminLogoutButton />
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl border border-[#8b0000]/15 bg-white p-2 text-[#8b0000] shadow-sm hover:bg-[#ffd700]/10 md:hidden"
              aria-label={open ? "Đóng menu" : "Mở menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                {open ? (
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                ) : (
                  <path
                    d="M4 7h16M4 12h16M4 17h16"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="mt-3 hidden flex-wrap items-center gap-2 text-sm font-semibold md:flex">
          {items.map((it) => {
            const active = pathname === it.href || (it.href !== "/" && pathname.startsWith(it.href));
            return (
              <Link
                key={it.href}
                href={it.href}
                className={
                  active
                    ? "rounded-xl bg-[#ffd700]/30 px-3 py-2 text-slate-900"
                    : "rounded-xl px-3 py-2 text-slate-800 hover:bg-[#ffd700]/25"
                }
              >
                {it.label}
              </Link>
            );
          })}
        </nav>

      </div>

      {/* Mobile/Tablet right-side drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Đóng menu"
            className="absolute inset-0 bg-black/20"
            onClick={() => setOpen(false)}
          />

          <aside className="absolute right-0 top-0 h-full w-[min(340px,85vw)] border-l border-[#8b0000]/15 bg-white shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between gap-3 border-b border-[#8b0000]/10 p-4">
              <div className="text-sm font-extrabold text-[#8b0000]">Menu quản trị</div>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl border border-[#8b0000]/15 bg-white p-2 text-[#8b0000] shadow-sm hover:bg-[#ffd700]/10"
                onClick={() => setOpen(false)}
                aria-label="Đóng"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <nav className="p-3">
              <div className="grid gap-2">
                {items.map((it) => {
                  const active = pathname === it.href || (it.href !== "/" && pathname.startsWith(it.href));
                  return (
                    <Link
                      key={it.href}
                      href={it.href}
                      className={
                        active
                          ? "rounded-xl bg-[#ffd700]/30 px-3 py-3 text-sm font-extrabold text-slate-900"
                          : "rounded-xl px-3 py-3 text-sm font-bold text-slate-800 hover:bg-[#ffd700]/25"
                      }
                    >
                      {it.label}
                    </Link>
                  );
                })}

                <div className="mt-2 border-t border-[#8b0000]/10 pt-3">
                  <AdminLogoutButton />
                </div>
              </div>
            </nav>
          </aside>
        </div>
      ) : null}
    </header>
  );
}

