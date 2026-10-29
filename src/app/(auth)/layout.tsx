import { LocaleProvider } from "@/i18n/locale-context";
import { requestLocale } from "@/i18n/request-locale";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await requestLocale();
  return <LocaleProvider locale={locale}>{children}</LocaleProvider>;
}
