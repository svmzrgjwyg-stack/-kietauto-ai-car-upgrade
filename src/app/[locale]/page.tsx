import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-[var(--line)] bg-gradient-to-br from-[#0b3d5c] via-[#124a6b] to-[#1a5f7a] px-6 py-10 text-white shadow-[0_24px_60px_-28px_rgba(11,61,92,0.7)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />
      <p className="animate-rise font-display text-4xl font-bold tracking-tight">
        {t("brand")}
      </p>
      <h1 className="animate-rise-delay mt-3 max-w-[16ch] text-2xl font-semibold leading-snug">
        {t("tagline")}
      </h1>
      <p className="animate-rise-delay mt-4 text-sm leading-relaxed text-white/85">
        {t("home.subtitle")}
      </p>
      <Link
        href={`/${locale}/vehicle`}
        className="animate-cta mt-8 inline-flex min-h-12 items-center justify-center rounded-2xl bg-[var(--accent)] px-6 text-sm font-bold text-[var(--ink)]"
      >
        {t("home.cta")}
      </Link>
      <p className="mt-6 text-[11px] leading-relaxed text-white/70">
        {t("home.disclaimer")}
      </p>
    </section>
  );
}
