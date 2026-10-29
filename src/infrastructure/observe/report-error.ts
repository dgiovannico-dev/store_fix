import { logJson } from "@/infrastructure/log";

/**
 * Report soft verso GlitchTip/Sentry se SENTRY_DSN presente; altrimenti solo log.
 * Dynamic import con webpackIgnore: @sentry/node non deve entrare nel client bundle.
 */
export async function reportError(
  err: unknown,
  context: Record<string, unknown> = {},
): Promise<void> {
  const message = err instanceof Error ? err.message : String(err);
  logJson("error", message, {
    ...context,
    stack: err instanceof Error ? err.stack : undefined,
  });

  if (!process.env.SENTRY_DSN?.trim()) return;
  try {
    const Sentry = await import(
      /* webpackIgnore: true */ "@sentry/node"
    );
    if (err instanceof Error) {
      Sentry.captureException(err, { extra: context });
    } else {
      Sentry.captureMessage(message, { level: "error", extra: context });
    }
  } catch (e) {
    logJson("warn", "observe.report_failed", {
      reason: (e as Error).message,
    });
  }
}
