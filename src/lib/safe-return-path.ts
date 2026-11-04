/**
 * Whitelist relative in-app return paths (no open redirect).
 */
export function safeAppReturnPath(
  raw: string | undefined | null,
  fallback = "/app/tickets",
): string {
  if (!raw) return fallback;
  const path = raw.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("://")) {
    return fallback;
  }
  if (!path.startsWith("/app")) return fallback;
  if (path.includes("\\") || path.includes("\0")) return fallback;
  return path;
}

export function isWallboardReturnPath(path: string): boolean {
  return path === "/app/wallboard" || path.startsWith("/app/wallboard?");
}
