import type { MetadataRoute } from "next";

/** Web App Manifest (F2-06 PWA offline-light). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FacilityFlow",
    short_name: "FacilityFlow",
    description:
      "Manutenzione retail: ticket, SLA e fornitori — System of Record.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f9f8f6",
    theme_color: "#2a3a55",
    lang: "it",
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
