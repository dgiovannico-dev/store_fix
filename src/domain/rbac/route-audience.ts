import { Role } from "@prisma/client";

/**
 * Redirect se il ruolo non può aprire `pathname` (leak cross-audience).
 * `null` = percorso ammesso.
 */
export function forbiddenAppPathRedirect(
  role: Role | null | undefined,
  pathname: string,
): string | null {
  if (!role) return "/login";

  if (role === Role.vendor) {
    if (pathname.startsWith("/app") || pathname.startsWith("/onboarding")) {
      return "/vendor/inbox";
    }
    return null;
  }

  if (pathname.startsWith("/vendor")) {
    if (role === Role.store_manager || role === Role.store_staff) {
      return "/app/tickets";
    }
    return "/app/dashboard";
  }

  const store =
    role === Role.store_manager || role === Role.store_staff;
  if (store) {
    const allowed =
      pathname.startsWith("/app/tickets") ||
      pathname.startsWith("/app/segnala") ||
      pathname === "/app/settings/locale" ||
      pathname.startsWith("/app/settings/locale?") ||
      pathname.startsWith("/onboarding");
    if (pathname.startsWith("/app") && !allowed) {
      return "/app/tickets";
    }
    return null;
  }

  if (role === Role.viewer_finance) {
    const allowed =
      pathname.startsWith("/app/dashboard") ||
      pathname.startsWith("/app/tickets") ||
      pathname.startsWith("/app/contratti") ||
      pathname.startsWith("/app/finance/chargeback") ||
      pathname.startsWith("/onboarding");
    if (pathname.startsWith("/app") && !allowed) {
      return "/app/dashboard";
    }
    return null;
  }

  return null;
}
