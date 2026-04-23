"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // Avoid server redirect here; it can trip Performance.measure in some browsers/dev builds.
    router.replace("/admin/login");
  }, [router]);

  return (
    <div className="mx-auto max-w-md rounded-2xl border-2 border-[#8b0000]/15 bg-white/85 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.12)]">
      <div className="text-lg font-extrabold text-[#8b0000]">Trang không tồn tại</div>
      <div className="mt-2 text-sm text-slate-700">
        Bạn sẽ được chuyển về trang đăng nhập. Nếu không tự chuyển, bấm nút bên dưới.
      </div>
      <div className="mt-4">
        <Link
          href="/admin/login"
          className="inline-flex rounded-xl bg-gradient-to-r from-[#8b0000] via-[#dc143c] to-[#b01919] px-4 py-2 text-sm font-extrabold text-white shadow-[0_10px_25px_rgba(139,0,0,0.35)] hover:brightness-110"
        >
          Về trang đăng nhập
        </Link>
      </div>
    </div>
  );
}

