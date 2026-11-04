import type { Session } from "next-auth";
import { auth } from "@/auth";

/**
 * Session usable by tenant-scoped server actions: user + tenantId + role.
 * Returns null when any claim is missing (caller maps to accessRequired).
 */
export async function sessionTenant(): Promise<Session | null> {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId || !session.role) {
    return null;
  }
  return session;
}
