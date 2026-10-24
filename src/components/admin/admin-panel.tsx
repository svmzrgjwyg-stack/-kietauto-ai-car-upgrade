"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AdminProducts } from "./admin-products";
import { AdminFitment } from "./admin-fitment";

type Tab = "products" | "fitment";

export function AdminPanel() {
  const t = useTranslations("admin");
  const [tab, setTab] = useState<Tab>("products");

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("products")}
          className={`min-h-11 flex-1 rounded-xl text-sm font-semibold ${
            tab === "products"
              ? "bg-[var(--brand)] text-white"
              : "border border-[var(--line)] bg-white text-[var(--muted)]"
          }`}
        >
          {t("productsTab")}
        </button>
        <button
          type="button"
          onClick={() => setTab("fitment")}
          className={`min-h-11 flex-1 rounded-xl text-sm font-semibold ${
            tab === "fitment"
              ? "bg-[var(--brand)] text-white"
              : "border border-[var(--line)] bg-white text-[var(--muted)]"
          }`}
        >
          {t("fitmentTab")}
        </button>
      </div>
      {tab === "products" ? <AdminProducts /> : <AdminFitment />}
    </div>
  );
}
