"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/admin/ui";

async function readError(res: Response, fallback: string) {
  const data = (await res.json().catch(() => null)) as { error?: string } | null;
  return data?.error ?? fallback;
}

export function DeleteEntryButton({ id, code, disabled }: { id: number; code: string; disabled?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (busy || !confirm(`Xoá phiếu ${code}?`)) return;
    setBusy(true);
    const res = await fetch(`/api/ledger/entries/${id}`, { method: "DELETE" });
    if (!res.ok) alert(await readError(res, "Xoá thất bại"));
    setBusy(false);
    router.refresh();
  }

  return (
    <Button size="xs" variant="danger" onClick={onDelete} disabled={disabled || busy}>
      {busy ? "Đang xoá..." : "Xoá"}
    </Button>
  );
}

export function LockToggleButton({
  year,
  month,
  locked,
  size = "sm",
}: {
  year: number;
  month: number;
  locked: boolean;
  size?: "xs" | "sm";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onToggle() {
    const msg = locked
      ? `Mở khoá sổ tháng ${month}/${year}? Sau khi mở có thể sửa/xoá phiếu và công đức của tháng này.`
      : `Khoá sổ tháng ${month}/${year}? Sau khi khoá không thêm/sửa/xoá được phiếu và công đức của tháng này.`;
    if (busy || !confirm(msg)) return;
    setBusy(true);
    const res = await fetch("/api/ledger/locks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, month, locked: !locked }),
    });
    if (!res.ok) alert(await readError(res, "Không thực hiện được"));
    setBusy(false);
    router.refresh();
  }

  return (
    <Button size={size} variant={locked ? "outline" : "success"} onClick={onToggle} disabled={busy}>
      {busy ? "..." : locked ? "Mở khoá sổ" : "Khoá sổ tháng"}
    </Button>
  );
}

export function PrintButton({ label = "In báo cáo" }: { label?: string }) {
  return (
    <Button variant="outline" onClick={() => window.print()} className="print:hidden">
      {label}
    </Button>
  );
}
