"use client";

import { SessionProvider } from "next-auth/react";
import { ComboProvider } from "@/components/combo/combo-context";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ComboProvider>{children}</ComboProvider>
    </SessionProvider>
  );
}
