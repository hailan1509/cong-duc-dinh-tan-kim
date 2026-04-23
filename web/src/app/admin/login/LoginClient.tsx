"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";

function LoginInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/admin/cong-duc";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Đăng nhập thất bại");
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <Suspense>
      <div className="fixed inset-0 overflow-auto px-4 py-8">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-[#7a0000] via-[#dc143c] to-[#ffdd6d] opacity-15" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_0%,rgba(255,215,0,0.40),transparent_60%),radial-gradient(circle_at_110%_90%,rgba(220,20,60,0.35),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-black/5" />

        <div className="mx-auto flex min-h-full max-w-2xl items-center justify-center">
          <div className="w-full">
            <div className="mx-auto mb-6 max-w-2xl text-center">
              <div className="mt-3 text-2xl font-extrabold leading-tight tracking-tight text-slate-950 md:text-4xl">
                <div className="inline-block rounded-2xl bg-gradient-to-br from-[#ffeaa0]/95 to-white/85 px-4 py-3 shadow-[0_18px_55px_rgba(0,0,0,0.25)]">
                  <div className="text-base font-black uppercase tracking-wide text-[#8b0000] md:text-lg">
                    Hệ thống quản trị
                  </div>
                  <div className="mt-0.5 whitespace-nowrap text-[clamp(1.25rem,5.2vw,2rem)] font-black leading-none tracking-wide text-[#0b1220] drop-shadow-[0_2px_0_rgba(255,215,0,0.45)] md:text-5xl">
                    Công Đức Đình Làng Tân Kim
                  </div>
                </div>
              </div>
            </div>

            <div className="mx-auto max-w-md rounded-2xl border-2 border-[#8b0000]/25 bg-gradient-to-b from-[#fff7e6]/90 to-white/90 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.22)] backdrop-blur md:p-6">
              <div className="mb-4">
                <div className="text-lg font-extrabold text-[#8b0000]">Đăng nhập hệ thống</div>
              </div>

              <form onSubmit={onSubmit} className="space-y-3">
                <label className="block">
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base outline-none ring-0 transition focus:border-[#8b0000]/50 focus:shadow-[0_0_0_4px_rgba(255,215,0,0.20)]"
                    autoComplete="username"
                    placeholder="Nhập tài khoản"
                    required
                    disabled={loading}
                  />
                </label>

                <label className="block">
                  <div className="text-xs font-semibold text-slate-700">Mật khẩu</div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base outline-none ring-0 transition focus:border-[#8b0000]/50 focus:shadow-[0_0_0_4px_rgba(255,215,0,0.20)]"
                    autoComplete="current-password"
                    placeholder="Nhập mật khẩu"
                    required
                    disabled={loading}
                  />
                </label>

                {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

                <button
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-[#8b0000] via-[#dc143c] to-[#b01919] px-4 py-3 text-base font-extrabold text-white shadow-[0_10px_25px_rgba(139,0,0,0.35)] transition hover:brightness-110 active:translate-y-[1px] disabled:opacity-60"
                >
                  {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  );
}

export default function LoginClient() {
  return <LoginInner />;
}

