import { connection } from "next/server";
import { readCatalog } from "@/lib/catalog/server";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ComboView } from "@/components/combo/combo-view";

export default async function ComboPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await connection();
  const catalog = await readCatalog();
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("combo");

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold text-[var(--ink)]">
        {t("title")}
      </h1>
      <ComboView catalog={catalog} />
    </div>
  );
}
