"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    if (loading) return;
    setLoading(true);
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => null);
    router.push("/admin/login");
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={onLogout}
      disabled={loading}
      className="whitespace-nowrap rounded-xl border border-[#8b0000]/15 bg-white/70 px-3 py-2 text-sm font-extrabold text-[#8b0000] shadow-sm hover:bg-white disabled:opacity-60"
    >
      {loading ? "Đang đăng xuất..." : "Đăng xuất"}
    </button>
  );
}

