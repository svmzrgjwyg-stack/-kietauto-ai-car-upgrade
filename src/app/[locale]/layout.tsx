import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { AppProviders } from "@/components/providers/app-providers";
import { SiteHeader } from "@/components/layout/site-header";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "vi" | "en")) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <AppProviders>
        <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
          <SiteHeader />
          <main className="flex-1 px-4 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            {children}
          </main>
        </div>
      </AppProviders>
    </NextIntlClientProvider>
  );
}
