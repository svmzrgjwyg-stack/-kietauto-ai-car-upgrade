import { getTranslations, setRequestLocale } from "next-intl/server";
import { VehiclePicker } from "@/components/vehicle/vehicle-picker";

export default async function VehiclePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("vehicle");

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold text-[var(--ink)]">
        {t("title")}
      </h1>
      <VehiclePicker />
    </div>
  );
}
