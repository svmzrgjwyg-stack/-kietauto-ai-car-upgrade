import { setRequestLocale } from "next-intl/server";
import { ReferenceBrowser } from "@/components/catalog/reference-browser";
import { fitmentReferences } from "@/lib/catalog/reference";
export default async function CatalogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ReferenceBrowser references={fitmentReferences} locale={locale === "en" ? "en" : "vi"} />;
}
