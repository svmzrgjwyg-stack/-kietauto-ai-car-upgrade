"use client";

import { useTranslations } from "next-intl";
import type { FitmentStatus } from "@/types";

const styles: Record<FitmentStatus, string> = {
  verified: "bg-emerald-100 text-emerald-900 border-emerald-300",
  unverified: "bg-amber-100 text-amber-950 border-amber-300",
  incompatible: "bg-rose-100 text-rose-900 border-rose-300",
};

export function FitmentBadge({ status }: { status: FitmentStatus }) {
  const t = useTranslations("fitment");
  const label =
    status === "verified"
      ? t("verified")
      : status === "incompatible"
        ? t("incompatible")
        : t("unverified");

  return (
    <span
      role="status"
      aria-label={t("badgeAria")}
      className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold tracking-wide ${styles[status]}`}
    >
      {label}
    </span>
  );
}
