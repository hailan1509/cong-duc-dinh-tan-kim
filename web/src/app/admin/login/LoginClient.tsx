"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import AuthLayout from "@/components/admin/AuthLayout";
import { Alert, Button, Field, Input } from "@/components/admin/ui";

function LoginInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/admin/cong-duc";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      <AuthLayout>
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-800 sm:text-3xl">Đăng nhập</h1>
          <p className="mt-2 text-sm text-gray-500">Nhập tài khoản và mật khẩu để vào trang quản trị.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <Field label={<>Tài khoản <span className="text-red-500">*</span></>}>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="Nhập tài khoản"
              required
              disabled={loading}
            />
          </Field>

          <Field label={<>Mật khẩu <span className="text-red-500">*</span></>}>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
                required
                disabled={loading}
                className="pr-16"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                tabIndex={-1}
              >
                {showPassword ? "Ẩn" : "Hiện"}
              </button>
            </div>
          </Field>

          {error ? <Alert>{error}</Alert> : null}

          <Button type="submit" size="lg" disabled={loading} className="w-full">
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </form>
      </AuthLayout>
    </Suspense>
  );
}

export default function LoginClient() {
  return <LoginInner />;
}

