import type { Membership, Role, Ticket } from "@prisma/client";
import { ForbiddenError } from "@/domain/rbac/guards";

/** Vendor vede solo ticket assegnati al proprio vendorId. */
export function assertVendorTicketScope(
  membership: Pick<Membership, "role" | "vendorId" | "deletedAt">,
  ticket: Pick<Ticket, "vendorId">,
  role: Role,
): void {
  if (role !== "vendor") return;
  if (
    !membership.vendorId ||
    !ticket.vendorId ||
    membership.vendorId !== ticket.vendorId
  ) {
    throw new ForbiddenError("Ticket fuori scope vendor", "vendorOutOfScope");
  }
}
