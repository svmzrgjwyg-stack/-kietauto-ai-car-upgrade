import { getTranslations, setRequestLocale } from "next-intl/server";
import { AdminProducts } from "@/components/admin/admin-products";

export default async function AdminProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold text-[var(--ink)]">
        {t("title")}
      </h1>
      <AdminProducts />
    </div>
  );
}
