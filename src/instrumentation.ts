/**
 * Next.js instrumentation — GlitchTip/Sentry opt-in (F3-02 retro).
 * Attivo solo se `SENTRY_DSN` è impostato (self-host GlitchTip).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return;

  const Sentry = await import("@sentry/node");
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "development",
    tracesSampleRate: 0,
  });
}
