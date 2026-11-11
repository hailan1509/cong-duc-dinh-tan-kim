import { prisma } from "@/lib/db";
import { ButtonLink, Card } from "@/components/admin/ui";
import { serifFont } from "@/components/admin/font";
import { PrintButton } from "@/components/ledger/clientActions";
import { vnd } from "@/components/ledger/format";
import { lunarInfo, lunarYearName } from "@/lib/lunar";
import { numberToVietnameseWords } from "@/lib/vnWords";
import { vnDateKey } from "@/lib/vnDate";

export const dynamic = "force-dynamic";

/** Biên bản kiểm đếm hòm công đức — bản in A4 có chỗ ký. `id` là id của phiếu thu. */
export default async function BoxCountRecordPage(props: { params: Promise<{ id: string }> }) {
  const id = Number((await props.params).id);
  const entry = Number.isInteger(id)
    ? await prisma.ledgerEntry.findUnique({ where: { id }, include: { boxCount: true, festival: true } })
    : null;

  if (!entry?.boxCount) {
    return (
      <Card>
        <div className="text-sm text-gray-600 dark:text-gray-400">Không tìm thấy biên bản.</div>
      </Card>
    );
  }

  const b = entry.boxCount;
  const key = vnDateKey(entry.date);
  const [y, m, d] = key.split("-").map(Number);
  const l = lunarInfo(d, m, y);
  const denominations = (b.denominations as Array<{ value: number; count: number }>) ?? [];
  const people = b.participants
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const countedAt = new Date(b.countedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" });

  return (
    <div>
      <div className="mb-4 flex flex-wrap justify-end gap-2 print:hidden">
        <ButtonLink href={`/admin/thu-chi?y=${y}&m=${m}&d=${key}`} variant="outline">
          Về sổ thu chi
        </ButtonLink>
        <PrintButton label="In biên bản" />
      </div>

      <article className={`${serifFont.variable} mx-auto max-w-[210mm] bg-white p-8 font-[family-name:var(--font-serif-vn)] text-[15px] leading-relaxed text-black shadow-theme-md print:max-w-none print:p-0 print:shadow-none sm:p-12`}>
        <div className="grid grid-cols-2 gap-4 text-center text-sm">
          <div>
            <div className="font-bold uppercase">Ban quản lý di tích</div>
            <div className="font-bold uppercase">Đình Tân Kim</div>
            <div className="mx-auto mt-1 h-px w-24 bg-black" />
          </div>
          <div>
            <div className="font-bold uppercase">Cộng hoà xã hội chủ nghĩa Việt Nam</div>
            <div className="font-bold">Độc lập – Tự do – Hạnh phúc</div>
            <div className="mx-auto mt-1 h-px w-40 bg-black" />
          </div>
        </div>

        <h1 className="mt-8 text-center text-xl font-bold uppercase">Biên bản kiểm đếm tiền công đức</h1>
        <p className="text-center text-sm italic">
          Số phiếu thu: {entry.code} · Ngày {d}/{m}/{y} (âm lịch {l.label} năm {lunarYearName(l.year)})
        </p>

        <p className="mt-6">
          Hồi {countedAt} ngày {d} tháng {m} năm {y}, tại {b.location}
          {entry.festival ? ` (dịp ${entry.festival.name})` : ""}, chúng tôi gồm:
        </p>
        <ol className="mt-2 list-decimal pl-8">
          {people.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ol>
        <p className="mt-3">Đã tiến hành mở hòm và kiểm đếm tiền công đức, kết quả như sau:</p>

        <table className="mt-3 w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-black px-2 py-1">STT</th>
              <th className="border border-black px-2 py-1">Mệnh giá</th>
              <th className="border border-black px-2 py-1">Số tờ</th>
              <th className="border border-black px-2 py-1">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {denominations.map((row, i) => (
              <tr key={row.value}>
                <td className="border border-black px-2 py-1 text-center">{i + 1}</td>
                <td className="border border-black px-2 py-1 text-right">{vnd(row.value)}</td>
                <td className="border border-black px-2 py-1 text-right">{row.count.toLocaleString("vi-VN")}</td>
                <td className="border border-black px-2 py-1 text-right">{vnd(row.value * row.count)}</td>
              </tr>
            ))}
            <tr className="font-bold">
              <td className="border border-black px-2 py-1 text-center" colSpan={2}>
                Tổng cộng
              </td>
              <td className="border border-black px-2 py-1 text-right">
                {denominations.reduce((s, r) => s + r.count, 0).toLocaleString("vi-VN")}
              </td>
              <td className="border border-black px-2 py-1 text-right">{vnd(b.total)}</td>
            </tr>
          </tbody>
        </table>

        <p className="mt-3">
          Tổng số tiền bằng chữ: <i className="inline-block first-letter:uppercase">{numberToVietnameseWords(b.total)}</i>.
        </p>
        {b.note ? <p className="mt-1">Ghi chú: {b.note}</p> : null}
        <p className="mt-1">
          Toàn bộ số tiền trên đã được ghi vào sổ thu chi theo phiếu thu {entry.code}. Biên bản lập xong lúc ……… cùng ngày, các
          thành viên thống nhất ký tên.
        </p>

        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-16 text-center text-sm sm:grid-cols-3">
          {people.map((p, i) => (
            <div key={i}>
              <div className="font-bold">{p.split(/\s[–-]\s/)[1] ?? "Thành viên"}</div>
              <div className="italic">(Ký, ghi rõ họ tên)</div>
              <div className="mt-16">{p.split(/\s[–-]\s/)[0]}</div>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}
