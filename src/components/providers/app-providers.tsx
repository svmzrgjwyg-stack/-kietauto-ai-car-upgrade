"use client";

import { SessionProvider } from "next-auth/react";
import { ComboProvider } from "@/components/combo/combo-context";
import { ReferenceSelectionProvider } from "@/components/browse/reference-selection-context";
import { ToastProvider } from "@/components/ui/toast";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <ComboProvider><ReferenceSelectionProvider>{children}</ReferenceSelectionProvider></ComboProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
