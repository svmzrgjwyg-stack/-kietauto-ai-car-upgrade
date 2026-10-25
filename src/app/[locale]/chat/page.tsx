import { getTranslations, setRequestLocale } from "next-intl/server";
import { ChatView } from "@/components/chat/chat-view";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("chat");

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold text-[var(--ink)]">
        {t("title")}
      </h1>
      <ChatView />
    </div>
  );
}
