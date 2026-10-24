"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useCombo } from "@/components/combo/combo-context";
import { vehicleLabel } from "@/lib/catalog/data";
import type { AiMessage } from "@/lib/ai";

export function ChatView() {
  const t = useTranslations("chat");
  const locale = useLocale() as "vi" | "en";
  const { vehicle, items } = useCombo();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      role: "assistant",
      content:
        locale === "vi"
          ? "Xin chào! Hỏi tôi về phụ kiện hoặc fitment. Tư vấn rule-based — không gọi LLM trả phí."
          : "Hi! Ask about accessories or fitment. Rule-based advisory — no paid LLM calls.",
    },
  ]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const nextUser: AiMessage = { role: "user", content: text };
    setMessages((m) => [...m, nextUser]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, nextUser],
          context: {
            locale,
            vehicle,
            vehicleLabel: vehicle ? vehicleLabel(vehicle) : undefined,
            comboProductIds: items.map((i) => i.productId),
          },
        }),
      });
      const data = await res.json();
      setMessages((m) => [...m, data.message as AiMessage]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            locale === "vi"
              ? "Lỗi kết nối stub. Thử lại."
              : "Stub connection error. Try again.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] flex-col">
      <p className="mb-3 text-xs text-[var(--muted)]">{t("hint")}</p>
      <div className="flex-1 space-y-3 overflow-y-auto rounded-3xl border border-[var(--line)] bg-white p-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[92%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed ${
              m.role === "user"
                ? "ml-auto bg-[var(--brand)] text-white"
                : "bg-[var(--wash)] text-[var(--ink)]"
            }`}
          >
            {m.content}
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2 pb-[env(safe-area-inset-bottom)]">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={t("placeholder")}
          className="min-h-12 flex-1 rounded-2xl border border-[var(--line)] px-4 text-sm"
        />
        <button
          type="button"
          onClick={send}
          disabled={busy}
          className="min-h-12 rounded-2xl bg-[var(--brand)] px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          {t("send")}
        </button>
      </div>
    </div>
  );
}
