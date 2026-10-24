"use client";

import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLoginForm() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState("admin@kietauto.local");
  const [password, setPassword] = useState("admin-demo");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setBusy(false);
    if (res?.error) {
      setError("Invalid credentials");
      return;
    }
    router.push(`/${locale}/admin/products`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="rounded-2xl border border-[var(--line)] bg-[var(--wash)] px-4 py-3 text-xs leading-relaxed text-[var(--muted)]">
        {t("roleNote")}
      </p>
      <label className="block space-y-2 text-sm font-semibold">
        {t("email")}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-h-12 w-full rounded-2xl border border-[var(--line)] px-4 font-normal"
          required
        />
      </label>
      <label className="block space-y-2 text-sm font-semibold">
        {t("password")}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="min-h-12 w-full rounded-2xl border border-[var(--line)] px-4 font-normal"
          required
        />
      </label>
      {error && <p className="text-sm text-rose-700">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-[var(--brand)] text-sm font-semibold text-white"
      >
        {t("signIn")}
      </button>
      <p className="text-[11px] text-[var(--muted)]">
        Demo: admin@kietauto.local / admin-demo · editor@kietauto.local /
        editor-demo
      </p>
    </form>
  );
}
