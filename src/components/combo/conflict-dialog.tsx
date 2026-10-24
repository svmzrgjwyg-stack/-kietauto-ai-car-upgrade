"use client";

import { useTranslations } from "next-intl";
import type { CategoryConflict } from "@/lib/combo/conflicts";

type Props = {
  conflict: CategoryConflict;
  onKeepBoth: () => void;
  onReplace: () => void;
  onCancel: () => void;
};

export function ConflictDialog({
  conflict,
  onKeepBoth,
  onReplace,
  onCancel,
}: Props) {
  const t = useTranslations();
  const existingName = t(
    conflict.existingProduct.nameKey as Parameters<typeof t>[0],
  );
  const newName = t(conflict.newProduct.nameKey as Parameters<typeof t>[0]);
  const categoryName = t(
    `categories.${categoryKey(conflict.categoryId)}` as Parameters<typeof t>[0],
  );

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="conflict-title"
    >
      <div className="w-full max-w-md rounded-3xl border border-[var(--line)] bg-white p-5 shadow-xl">
        <h2
          id="conflict-title"
          className="font-display text-lg font-bold text-[var(--ink)]"
        >
          {t("combo.conflictTitle")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          {t("combo.conflictBody", {
            category: categoryName,
            existing: existingName,
            incoming: newName,
          })}
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={onReplace}
            className="min-h-12 touch-manipulation rounded-2xl bg-[var(--brand)] text-sm font-semibold text-white"
          >
            {t("combo.conflictReplace")}
          </button>
          <button
            type="button"
            onClick={onKeepBoth}
            className="min-h-12 touch-manipulation rounded-2xl border border-[var(--brand)] bg-white text-sm font-semibold text-[var(--brand)]"
          >
            {t("combo.conflictKeep")}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 touch-manipulation text-sm font-semibold text-[var(--muted)]"
          >
            {t("combo.conflictCancel")}
          </button>
        </div>
      </div>
    </div>
  );
}

function categoryKey(categoryId: string): string {
  const map: Record<string, string> = {
    dashcam: "dashcam",
    "head-unit": "headUnit",
    carplay: "carplay",
    "camera-360": "camera360",
    lights: "lights",
    "power-liftgate": "powerLiftgate",
    other: "other",
  };
  return map[categoryId] ?? "other";
}
