import type { Role } from "@prisma/client";
import { prisma } from "@/infrastructure/db/prisma";

export type MembershipClaims = {
  tenantId?: string;
  role?: Role;
  membershipId?: string;
};

/**
 * Active (non soft-deleted) membership claims for JWT/session.
 * Prefer the stored membershipId when still valid; otherwise first active membership.
 */
export async function resolveActiveMembershipClaims(
  userId: string,
  membershipId?: string,
): Promise<MembershipClaims> {
  if (membershipId) {
    const current = await prisma.membership.findFirst({
      where: { id: membershipId, userId, deletedAt: null },
    });
    if (current) {
      return {
        tenantId: current.tenantId,
        role: current.role,
        membershipId: current.id,
      };
    }
  }

  const membership = await prisma.membership.findFirst({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });

  return {
    tenantId: membership?.tenantId,
    role: membership?.role,
    membershipId: membership?.id,
  };
}
