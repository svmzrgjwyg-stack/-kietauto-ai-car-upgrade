import { getTranslations, setRequestLocale } from "next-intl/server";
import { RecommendView } from "@/components/catalog/recommend-view";

export default async function RecommendPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("recommend");

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold text-[var(--ink)]">
        {t("title")}
      </h1>
      <RecommendView />
    </div>
  );
}
