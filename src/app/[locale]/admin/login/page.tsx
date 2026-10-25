import { getTranslations, setRequestLocale } from "next-intl/server";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export default async function AdminLoginPage({
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
        {t("login")}
      </h1>
      <AdminLoginForm />
    </div>
  );
}
