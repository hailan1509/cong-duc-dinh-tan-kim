import AddFestivalForm from "@/app/admin/ngay-le/AddFestivalForm";
import { ButtonLink, Card, PageHeader } from "@/components/admin/ui";

export default function AddFestivalPage() {
  return (
    <div>
      <PageHeader
        title="Thêm ngày lễ công đức"
        description="Tên lễ, ngày bắt đầu, ngày kết thúc, năm"
        crumbs={[{ label: "Ngày lễ", href: "/admin/ngay-le" }, { label: "Thêm mới" }]}
        actions={
          <ButtonLink href="/admin/ngay-le" variant="outline">
            Quay lại
          </ButtonLink>
        }
      />

      <Card className="max-w-3xl">
        <AddFestivalForm />
      </Card>
    </div>
  );
}
