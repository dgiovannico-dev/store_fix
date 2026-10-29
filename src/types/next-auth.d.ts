import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    /** DB Session.sessionToken — usato per revoke logout */
    sessionToken?: string;
    tenantId?: string;
    role?: Role;
    membershipId?: string;
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sessionToken?: string;
    tenantId?: string;
    role?: Role;
    membershipId?: string;
    /** Unix seconds — last authenticated request (idle timeout). */
    lastActiveAt?: number;
  }
}
