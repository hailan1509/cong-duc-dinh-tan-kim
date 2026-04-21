import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="font-semibold">
            Công đức đình Tân Kim
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link className="text-slate-700 hover:text-slate-900" href="/">
              Trang chủ
            </Link>
            <Link className="text-slate-700 hover:text-slate-900" href="/admin/cong-duc">
              Công đức
            </Link>
            <Link className="text-slate-700 hover:text-slate-900" href="/admin/ngay-le">
              Ngày lễ
            </Link>
            <Link className="text-slate-700 hover:text-slate-900" href="/admin/users">
              User
            </Link>
            <Link className="text-slate-700 hover:text-slate-900" href="/admin/tts">
              Giọng đọc
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      <footer className="border-t bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4 text-xs text-slate-600">
          © {new Date().getFullYear()} Công đức đình Tân Kim
        </div>
      </footer>
    </div>
  );
}

