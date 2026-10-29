"use client";

import { createContext, useContext, type ReactNode } from "react";
import { t, type Locale, type MessageCatalog } from "@/i18n";

const LocaleCtx = createContext<Locale>("it");

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return <LocaleCtx.Provider value={locale}>{children}</LocaleCtx.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleCtx);
}

export function useMessages(): MessageCatalog {
  return t(useLocale());
}
