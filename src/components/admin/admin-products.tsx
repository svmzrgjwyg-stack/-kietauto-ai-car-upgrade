"use client";

import { signOut, useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Product } from "@/types";

export function AdminProducts() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const { data: session, status } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/products");
    if (res.status === 401) {
      setError(t("unauthorized"));
      return;
    }
    const data = await res.json();
    setProducts(data.products ?? []);
  }

  useEffect(() => {
    if (status === "authenticated") void load();
  }, [status]);

  if (status === "loading") return <p>…</p>;

  if (status !== "authenticated") {
    return (
      <div className="space-y-3">
        <p className="text-sm">{t("unauthorized")}</p>
        <Link
          href={`/${locale}/admin/login`}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--brand)]"
        >
          {t("login")}
        </Link>
      </div>
    );
  }

  const role = session.user?.role;
  const canWrite = role === "admin" || role === "editor";

  async function save(product: Product) {
    const res = await fetch("/api/admin/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    if (!res.ok) {
      setError("Save failed");
      return;
    }
    const data = await res.json();
    setProducts(data.products);
  }

  async function hide(id: string) {
    if (role !== "admin") return;
    const res = await fetch(`/api/admin/products?id=${id}`, {
      method: "DELETE",
    });
    if (!res.ok) return;
    const data = await res.json();
    setProducts(data.products);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-[var(--muted)]">
          {session.user?.email} · {role}
        </p>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: `/${locale}/admin/login` })}
          className="text-sm font-semibold text-[var(--brand)]"
        >
          {t("signOut")}
        </button>
      </div>
      <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-950">
        {t("sampleMode")}
      </p>
      {error && <p className="text-sm text-rose-700">{error}</p>}
      <ul className="space-y-3">
        {products.map((p) => (
          <li
            key={p.id}
            className="space-y-2 rounded-3xl border border-[var(--line)] bg-white p-4"
          >
            <p className="font-semibold">
              {p.sku}{" "}
              <span className="text-xs font-normal text-[var(--muted)]">
                {p.active === false ? "(hidden)" : ""}
              </span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs">
                {t("price")}
                <input
                  type="number"
                  disabled={!canWrite}
                  value={p.priceUsd}
                  onChange={(e) =>
                    setProducts((all) =>
                      all.map((x) =>
                        x.id === p.id
                          ? { ...x, priceUsd: Number(e.target.value) }
                          : x,
                      ),
                    )
                  }
                  className="mt-1 min-h-11 w-full rounded-xl border border-[var(--line)] px-3"
                />
              </label>
              <label className="text-xs">
                {t("labor")}
                <input
                  type="number"
                  disabled={!canWrite}
                  value={p.laborCostUsd}
                  onChange={(e) =>
                    setProducts((all) =>
                      all.map((x) =>
                        x.id === p.id
                          ? { ...x, laborCostUsd: Number(e.target.value) }
                          : x,
                      ),
                    )
                  }
                  className="mt-1 min-h-11 w-full rounded-xl border border-[var(--line)] px-3"
                />
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!canWrite}
                onClick={() => save(p)}
                className="min-h-11 flex-1 rounded-xl bg-[var(--brand)] text-sm font-semibold text-white disabled:opacity-40"
              >
                {t("save")}
              </button>
              {role === "admin" && (
                <button
                  type="button"
                  onClick={() => hide(p.id)}
                  className="min-h-11 rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-700"
                >
                  {t("delete")}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
