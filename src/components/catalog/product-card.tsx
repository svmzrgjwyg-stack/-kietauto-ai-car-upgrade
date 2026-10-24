"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { FitmentBadge } from "@/components/ui/fitment-badge";
import { formatUsd } from "@/lib/pricing/totals";
import type { FitmentStatus, Product } from "@/types";

type Props = {
  product: Product;
  status: FitmentStatus;
  locale: string;
  onAdd: () => void;
};

export function ProductCard({ product, status, locale, onAdd }: Props) {
  const t = useTranslations();
  const name = t(product.nameKey as Parameters<typeof t>[0]);
  const desc = t(product.descriptionKey as Parameters<typeof t>[0]);

  if (status === "incompatible") {
    return (
      <article className="overflow-hidden rounded-3xl border border-rose-200 bg-rose-50/60 opacity-80">
        <div className="flex gap-3 p-3">
          <Image
            src={product.imageUrl}
            alt=""
            width={88}
            height={88}
            className="h-[88px] w-[88px] rounded-2xl object-cover"
          />
          <div className="min-w-0 flex-1 space-y-2">
            <FitmentBadge status={status} />
            <h3 className="font-semibold text-[var(--ink)]">{name}</h3>
            <p className="text-xs text-[var(--muted)]">{desc}</p>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="overflow-hidden rounded-3xl border border-[var(--line)] bg-white shadow-[0_10px_30px_-18px_rgba(15,23,42,0.45)]">
      <div className="flex gap-3 p-3">
        <Image
          src={product.imageUrl}
          alt=""
          width={96}
          height={96}
          className="h-24 w-24 shrink-0 rounded-2xl bg-[var(--wash)] object-cover"
        />
        <div className="min-w-0 flex-1 space-y-2">
          <FitmentBadge status={status} />
          <h3 className="text-base font-semibold leading-snug text-[var(--ink)]">
            {name}
          </h3>
          <p className="text-xs leading-relaxed text-[var(--muted)]">{desc}</p>
          <p className="text-sm font-semibold text-[var(--ink)]">
            {t("recommend.price")}: {formatUsd(product.priceUsd, locale)}
            <span className="ml-2 font-medium text-[var(--muted)]">
              · {t("recommend.labor")} {formatUsd(product.laborCostUsd, locale)}
            </span>
          </p>
          <button
            type="button"
            onClick={onAdd}
            className="min-h-11 w-full rounded-xl bg-[var(--brand)] text-sm font-semibold text-white"
          >
            {t("recommend.add")}
          </button>
        </div>
      </div>
    </article>
  );
}
