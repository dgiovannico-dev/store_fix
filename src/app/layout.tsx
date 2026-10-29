import type { Metadata, Viewport } from "next";
import { plex, sora } from "@/app/fonts";
import { RegisterServiceWorker } from "@/components/pwa/register-service-worker";
import { t } from "@/i18n";
import { requestLocale } from "@/i18n/request-locale";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await requestLocale();
  const msg = t(locale);
  return {
    title: "FacilityFlow",
    description: msg.meta.description,
    applicationName: "FacilityFlow",
    appleWebApp: {
      capable: true,
      title: "FacilityFlow",
      statusBarStyle: "default",
    },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#2a3a55",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await requestLocale();
  return (
    <html lang={locale}>
      <body className={`${sora.variable} ${plex.variable} antialiased`}>
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
