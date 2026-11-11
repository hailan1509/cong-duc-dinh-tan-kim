import AuthLayout from "@/components/admin/AuthLayout";
import { ButtonLink } from "@/components/admin/ui";
import { IconShield } from "@/components/admin/icons";

export default async function ForbiddenPage(props: { searchParams?: Promise<{ next?: string }> }) {
  // `next` is kept in the URL by the middleware; not used for navigation here.
  await props.searchParams;

  return (
    <AuthLayout>
      <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 [&_svg]:size-7">
        <IconShield />
      </div>
      <h1 className="text-2xl font-semibold text-gray-800 sm:text-3xl">Bạn không có quyền</h1>
      <p className="mt-2 text-sm text-gray-500">Tài khoản của bạn không được phép xem chức năng này.</p>
      <ButtonLink href="/admin/cong-duc" size="lg" className="mt-8 w-full">
        Về danh sách công đức
      </ButtonLink>
    </AuthLayout>
  );
}
