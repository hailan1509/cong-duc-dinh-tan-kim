import Link from "next/link";

export default async function ForbiddenPage(props: { searchParams?: Promise<{ next?: string }> }) {
  const sp = (await props.searchParams) ?? {};
  const next = (sp.next || "").toString();

  return (
    <div className="fixed inset-0 overflow-auto px-4 py-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-[#7a0000] via-[#dc143c] to-[#ffdd6d] opacity-15" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_0%,rgba(255,215,0,0.40),transparent_60%),radial-gradient(circle_at_110%_90%,rgba(220,20,60,0.35),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-black/5" />

      <div className="mx-auto flex min-h-full max-w-md items-center justify-center">
        <div className="w-full rounded-2xl border-2 border-[#8b0000]/25 bg-gradient-to-b from-[#fff7e6]/90 to-white/90 p-5 shadow-[0_22px_80px_rgba(0,0,0,0.28)] md:p-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ffd700]/25 text-[#8b0000]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 2l9 4v6c0 6-4 10-9 10S3 18 3 12V6l9-4Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <path d="M12 7v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M12 17h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <div className="text-xl font-extrabold text-[#8b0000]">Bạn không có quyền</div>
              <div className="mt-1 text-sm text-slate-700">Tài khoản của bạn không được phép xem chức năng này.</div>
            </div>
          </div>

          <div className="mt-5 grid gap-2">
            <Link
              href="/admin/cong-duc"
              className="inline-flex w-full justify-center rounded-xl bg-gradient-to-r from-[#8b0000] via-[#dc143c] to-[#b01919] px-4 py-3 text-sm font-extrabold text-white shadow-[0_10px_25px_rgba(139,0,0,0.35)] hover:brightness-110"
            >
              Về danh sách công đức
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

