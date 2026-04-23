import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-[#7a0000] via-[#dc143c] to-[#ffdd6d] opacity-15" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_0%,rgba(255,215,0,0.40),transparent_60%),radial-gradient(circle_at_110%_90%,rgba(220,20,60,0.35),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-black/5" />

      <header className="sticky top-0 z-40 border-b border-[#8b0000]/15 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="font-extrabold tracking-tight text-[#8b0000]">
            Công đức đình Tân Kim
          </Link>
          <nav className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-semibold">
            <Link className="rounded-lg px-2 py-1 text-slate-800 hover:bg-[#ffd700]/25" href="/">
              Trang chủ
            </Link>
            <Link className="rounded-lg px-2 py-1 text-slate-800 hover:bg-[#ffd700]/25" href="/admin/cong-duc">
              Công đức
            </Link>
            <Link className="rounded-lg px-2 py-1 text-slate-800 hover:bg-[#ffd700]/25" href="/admin/ngay-le">
              Ngày lễ
            </Link>
            <Link className="rounded-lg px-2 py-1 text-slate-800 hover:bg-[#ffd700]/25" href="/admin/users">
              User
            </Link>
            <Link className="rounded-lg px-2 py-1 text-slate-800 hover:bg-[#ffd700]/25" href="/admin/tts">
              Giọng đọc
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="rounded-2xl border-2 border-[#8b0000]/20 bg-white/85 p-4 shadow-[0_20px_70px_rgba(0,0,0,0.18)] backdrop-blur md:p-6">
          {children}
        </div>
      </main>

      <footer className="border-t border-[#8b0000]/15 bg-white/60 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-4 text-xs font-medium text-slate-700">
          © {new Date().getFullYear()} Công đức đình Tân Kim
        </div>
      </footer>
    </div>
  );
}

