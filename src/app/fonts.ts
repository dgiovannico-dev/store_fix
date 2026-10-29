import localFont from "next/font/local";

/**
 * Self-hosted OFL fonts (no Google Fonts fetch at build time).
 * Avoids flaky CI: next/font/google + extensionless /l/font?kit= URLs
 * (vercel/next.js#99114).
 */
export const sora = localFont({
  variable: "--font-sora",
  display: "swap",
  src: [
    {
      path: "./fonts/sora-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/sora-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/sora-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
  ],
});

export const plex = localFont({
  variable: "--font-plex",
  display: "swap",
  src: [
    {
      path: "./fonts/ibm-plex-sans-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/ibm-plex-sans-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/ibm-plex-sans-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
  ],
});
