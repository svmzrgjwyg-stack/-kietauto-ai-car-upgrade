"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useCombo } from "@/components/combo/combo-context";

const links = [
  { href: "vehicle", key: "vehicle" as const },
  { href: "recommend", key: "recommend" as const },
  { href: "combo", key: "combo" as const },
  { href: "chat", key: "chat" as const },
];

export function SiteHeader() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const { items } = useCombo();
  const other = locale === "vi" ? "en" : "vi";
  const switched = pathname.replace(`/${locale}`, `/${other}`) || `/${other}`;

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link href={`/${locale}`} className="group flex min-w-0 flex-col">
          <span className="font-display text-xl font-bold tracking-tight text-[var(--brand)]">
            {t("brand")}
          </span>
          <span className="truncate text-[11px] text-[var(--muted)]">
            AI Car Upgrade
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={switched}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-[var(--line)] bg-white/70 px-3 text-sm font-semibold text-[var(--ink)]"
            aria-label="Switch language"
          >
            {other.toUpperCase()}
          </Link>
          <Link
            href={`/${locale}/combo`}
            className="relative inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--brand)] px-3 text-sm font-semibold text-white"
          >
            {t("nav.combo")}
            {items.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-bold text-[var(--ink)]">
                {items.reduce((n, i) => n + i.qty, 0)}
              </span>
            )}
          </Link>
        </div>
      </div>
      <nav className="mx-auto flex max-w-lg gap-1 overflow-x-auto px-3 pb-2">
        {links.map((l) => {
          const href = `/${locale}/${l.href}`;
          const active = pathname.startsWith(href);
          return (
            <Link
              key={l.href}
              href={href}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                  : "text-[var(--muted)]"
              }`}
            >
              {t(`nav.${l.key}`)}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
