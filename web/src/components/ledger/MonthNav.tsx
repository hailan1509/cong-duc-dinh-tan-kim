import Link from "next/link";
import { buttonClass, inputClass } from "@/components/admin/ui";
import { shiftMonth, ymHref } from "./format";

/** Prev / next month links + a no-JS month picker (GET form). */
export default function MonthNav({ base, year, month }: { base: string; year: number; month: number }) {
  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href={ymHref(base, prev.year, prev.month)} className={buttonClass("outline", "sm")} aria-label="Tháng trước">
        ‹
      </Link>
      <form action={base} className="flex items-center gap-2">
        <select name="m" defaultValue={month} className={`${inputClass} h-9 w-auto py-1.5`} aria-label="Tháng">
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={i + 1}>
              Tháng {i + 1}
            </option>
          ))}
        </select>
        <input
          name="y"
          type="number"
          min={2000}
          max={2100}
          defaultValue={year}
          className={`${inputClass} h-9 w-24 py-1.5`}
          aria-label="Năm"
        />
        <button type="submit" className={buttonClass("outline", "sm")}>
          Xem
        </button>
      </form>
      <Link href={ymHref(base, next.year, next.month)} className={buttonClass("outline", "sm")} aria-label="Tháng sau">
        ›
      </Link>
    </div>
  );
}
