/**
 * JWT idle timeout — track `lastActiveAt` (unix sec) in the Auth.js token.
 * Default off (`0`); enable with `AUTH_SESSION_IDLE_SEC` (e.g. 28800 = 8h).
 * Absolute maxAge (30d) still applies via `SESSION_MAX_AGE_SEC`.
 * @see docs/ops/AUTH.md
 */

/** Throttle how often we rewrite lastActiveAt into the JWT (seconds). */
export const SESSION_IDLE_TOUCH_EVERY_SEC = 60;

export function resolveSessionIdleSec(env?: {
  AUTH_SESSION_IDLE_SEC?: string | null;
}): number {
  const raw = (
    env?.AUTH_SESSION_IDLE_SEC ??
    process.env.AUTH_SESSION_IDLE_SEC ??
    "0"
  ).trim();
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n);
}

export function isSessionIdleExpired(
  lastActiveAtSec: number | undefined,
  idleSec: number,
  nowSec = Math.floor(Date.now() / 1000),
): boolean {
  if (idleSec <= 0) return false;
  if (typeof lastActiveAtSec !== "number" || !Number.isFinite(lastActiveAtSec)) {
    return false;
  }
  return nowSec - lastActiveAtSec > idleSec;
}

export function nextLastActiveAt(
  lastActiveAtSec: number | undefined,
  nowSec = Math.floor(Date.now() / 1000),
  touchEverySec = SESSION_IDLE_TOUCH_EVERY_SEC,
): number {
  if (
    typeof lastActiveAtSec === "number" &&
    Number.isFinite(lastActiveAtSec) &&
    nowSec - lastActiveAtSec < touchEverySec
  ) {
    return lastActiveAtSec;
  }
  return nowSec;
}
