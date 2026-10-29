import type { MetadataRoute } from "next";
import { t } from "@/i18n";
import { requestLocale } from "@/i18n/request-locale";

/** Web App Manifest (F2-06 PWA offline-light). */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const locale = await requestLocale();
  const msg = t(locale);
  return {
    name: "FacilityFlow",
    short_name: "FacilityFlow",
    description: msg.meta.pwaDescription,
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f9f8f6",
    theme_color: "#2a3a55",
    lang: locale,
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
