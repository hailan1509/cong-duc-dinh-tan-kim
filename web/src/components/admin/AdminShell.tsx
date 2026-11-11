"use client";

// Admin layout adapted from TailAdmin (MIT): collapsible sidebar + sticky header + dark mode.
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type React from "react";
import { adminFont } from "./font";
import {
  IconBook,
  IconCalendar,
  IconChart,
  IconCoins,
  IconSettings,
  IconChevronDown,
  IconExternal,
  IconList,
  IconLogout,
  IconMenu,
  IconMoon,
  IconPlusCircle,
  IconSpeaker,
  IconSun,
  IconTemple,
  IconUsers,
  IconX,
} from "./icons";
import { cn } from "./ui";

export type ShellViewer = { role: "admin" | "staff"; username: string } | null;

type NavItem = { href: string; label: string; icon: React.ReactNode; adminOnly?: boolean };
type NavGroup = { label: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    label: "Công đức",
    items: [
      { href: "/admin/cong-duc", label: "Danh sách công đức", icon: <IconList /> },
      { href: "/cong-duc/them", label: "Thêm công đức", icon: <IconPlusCircle /> },
    ],
  },
  {
    label: "Quản trị",
    items: [
      { href: "/admin/ngay-le", label: "Ngày lễ", icon: <IconCalendar />, adminOnly: true },
      { href: "/admin/users", label: "Người dùng", icon: <IconUsers />, adminOnly: true },
      { href: "/admin/tts", label: "Giọng đọc", icon: <IconSpeaker />, adminOnly: true },
    ],
  },
  {
    label: "Thu chi",
    items: [
      { href: "/admin/thu-chi", label: "Sổ thu chi", icon: <IconBook />, adminOnly: true },
      { href: "/admin/thu-chi/kiem-dem", label: "Kiểm đếm hòm", icon: <IconCoins />, adminOnly: true },
      { href: "/admin/thu-chi/bao-cao", label: "Báo cáo năm", icon: <IconChart />, adminOnly: true },
      { href: "/admin/thu-chi/cai-dat", label: "Cài đặt sổ", icon: <IconSettings />, adminOnly: true },
    ],
  },
  {
    label: "Hiển thị",
    items: [
      { href: "/", label: "Bảng vàng", icon: <IconExternal /> },
      { href: "/thu-chi", label: "Công khai thu chi", icon: <IconExternal /> },
    ],
  },
];

const THEME_KEY = "cdtk-admin-theme";
const COLLAPSE_KEY = "cdtk-admin-sidebar-collapsed";

// Runs before paint so a saved dark theme does not flash light.
const themeBootScript = `try{if(localStorage.getItem("${THEME_KEY}")==="dark")document.documentElement.classList.add("dark")}catch(e){}`;

function matches(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

/** The single most specific menu entry for the current path (so /admin/thu-chi/kiem-dem doesn't also light up /admin/thu-chi). */
function activeHref(pathname: string) {
  let best: string | null = null;
  for (const g of NAV) for (const it of g.items) if (matches(pathname, it.href) && (!best || it.href.length > best.length)) best = it.href;
  return best;
}

function useAdminTheme() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(THEME_KEY);
    } catch {
      // ignore
    }
    setDark(saved === "dark");
    // The public board ("/") never uses dark mode — drop the class when leaving the admin.
    return () => document.documentElement.classList.remove("dark");
  }, []);

  const toggle = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      try {
        localStorage.setItem(THEME_KEY, next ? "dark" : "light");
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return { dark, toggle };
}

export default function AdminShell({ viewer, children }: { viewer: ShellViewer; children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { dark, toggle } = useAdminTheme();

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      // ignore
    }
  }, []);

  // Close the mobile drawer on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  function onToggleSidebar() {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setCollapsed((v) => {
        const next = !v;
        try {
          localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
        } catch {
          // ignore
        }
        return next;
      });
    } else {
      setMobileOpen((v) => !v);
    }
  }

  const expanded = !collapsed || hovered || mobileOpen;
  const currentHref = activeHref(pathname);
  const role = viewer?.role ?? "staff";

  return (
    <div className={cn(adminFont.variable, "min-h-dvh bg-gray-50 font-admin text-gray-800 dark:bg-gray-950 dark:text-gray-200")}>
      <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />

      {/* Sidebar */}
      <aside
        onMouseEnter={() => collapsed && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "fixed top-0 left-0 z-50 flex h-dvh flex-col print:hidden border-r border-gray-200 bg-white px-4 transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900",
          expanded ? "w-[290px]" : "w-[90px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        aria-label="Menu quản trị"
      >
        <div className={cn("flex items-center gap-3 py-6", expanded ? "justify-between px-1" : "justify-center")}>
          <Link href="/admin/cong-duc" className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-gold-300 shadow-theme-sm [&_svg]:size-6">
              <IconTemple />
            </span>
            {expanded ? (
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-[15px] font-bold text-gray-900 dark:text-white">Đình Tân Kim</span>
                <span className="block truncate text-xs text-gray-500 dark:text-gray-400">Quản lý công đức</span>
              </span>
            ) : null}
          </Link>
          {mobileOpen ? (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="flex size-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 lg:hidden dark:text-gray-400 dark:hover:bg-white/5 [&_svg]:size-5"
              aria-label="Đóng menu"
            >
              <IconX />
            </button>
          ) : null}
        </div>

        <nav className="custom-scrollbar -mx-1 flex-1 overflow-y-auto px-1 pb-6">
          {NAV.map((group) => {
            const items = group.items.filter((it) => !it.adminOnly || role === "admin");
            if (!items.length) return null;
            return (
              <div key={group.label} className="mb-6">
                <h3
                  className={cn(
                    "mb-3 flex text-xs leading-5 font-medium tracking-wide text-gray-400 uppercase",
                    expanded ? "justify-start px-3" : "justify-center"
                  )}
                >
                  {expanded ? group.label : <span className="block h-px w-5 bg-gray-300 dark:bg-gray-700" />}
                </h3>
                <ul className="flex flex-col gap-1">
                  {items.map((it) => {
                    const active = it.href === currentHref;
                    return (
                      <li key={it.href}>
                        <Link
                          href={it.href}
                          title={expanded ? undefined : it.label}
                          className={cn(
                            "menu-item group",
                            active ? "menu-item-active" : "menu-item-inactive",
                            expanded ? "justify-start" : "justify-center"
                          )}
                        >
                          <span
                            className={cn(
                              "[&_svg]:size-6",
                              active
                                ? "text-brand-600 dark:text-brand-300"
                                : "text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300"
                            )}
                          >
                            {it.icon}
                          </span>
                          {expanded ? <span className="truncate">{it.label}</span> : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        {expanded ? (
          <div className="mb-5 rounded-2xl border border-gold-200 bg-gradient-to-br from-gold-50 to-white p-4 dark:border-gold-400/20 dark:from-gold-400/10 dark:to-transparent">
            <div className="text-sm font-semibold text-gray-800 dark:text-white/90">Bảng vàng công đức</div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Màn hình trình chiếu cập nhật trực tiếp.</p>
            <Link
              href="/"
              className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-brand-600 text-sm font-medium text-white hover:bg-brand-700 [&_svg]:size-4"
            >
              Mở bảng vàng <IconExternal />
            </Link>
          </div>
        ) : null}
      </aside>

      {/* Mobile backdrop */}
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Đóng menu"
          className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      {/* Main column */}
      <div
        className={cn(
          "flex min-h-dvh flex-col transition-all duration-300 ease-in-out print:ml-0",
          collapsed ? "lg:ml-[90px]" : "lg:ml-[290px]"
        )}
      >
        <header className="sticky top-0 z-30 flex w-full print:hidden border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
          <div className="flex w-full items-center justify-between gap-3 px-3 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onToggleSidebar}
                className="flex size-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 lg:size-11 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-white/5 [&_svg]:size-6"
                aria-label={mobileOpen ? "Đóng menu" : "Mở/thu gọn menu"}
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <IconX /> : <IconMenu />}
              </button>
              <Link href="/admin/cong-duc" className="font-bold text-gray-900 lg:hidden dark:text-white">
                Đình Tân Kim
              </Link>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={toggle}
                className="flex size-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:size-11 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white [&_svg]:size-5"
                aria-label={dark ? "Chuyển giao diện sáng" : "Chuyển giao diện tối"}
                title={dark ? "Giao diện sáng" : "Giao diện tối"}
              >
                {dark ? <IconSun /> : <IconMoon />}
              </button>
              <UserMenu viewer={viewer} />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-screen-2xl flex-1 p-4 md:p-6 print:p-0">{children}</main>

        <footer className="px-4 pb-6 print:hidden text-center text-xs text-gray-400 md:px-6 dark:text-gray-500">
          © {new Date().getFullYear()} Công đức đình Tân Kim
        </footer>
      </div>
    </div>
  );
}

function UserMenu({ viewer }: { viewer: ShellViewer }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function onLogout() {
    if (loading) return;
    setLoading(true);
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => null);
    router.push("/admin/login");
    router.refresh();
    setLoading(false);
  }

  const name = viewer?.username ?? "Tài khoản";
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full py-1 pr-1 pl-1 text-gray-700 hover:bg-gray-100 sm:pr-2 dark:text-gray-300 dark:hover:bg-white/5"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex size-10 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700 lg:size-11 dark:bg-brand-500/15 dark:text-brand-300">
          {initial}
        </span>
        <span className="hidden max-w-32 truncate text-sm font-medium sm:block">{name}</span>
        <IconChevronDown className={cn("hidden size-4 transition-transform sm:block", open && "rotate-180")} />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 mt-3 w-64 rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="px-2 pb-3">
            <div className="truncate text-sm font-semibold text-gray-800 dark:text-white/90">{name}</div>
            <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {viewer?.role === "admin" ? "Quản trị viên" : "Nhân viên (staff)"}
            </div>
          </div>
          <div className="border-t border-gray-200 pt-2 dark:border-gray-800">
            <button
              type="button"
              role="menuitem"
              onClick={onLogout}
              disabled={loading}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60 dark:text-gray-300 dark:hover:bg-white/5 [&_svg]:size-5"
            >
              <IconLogout />
              {loading ? "Đang đăng xuất..." : "Đăng xuất"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
