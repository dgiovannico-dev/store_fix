import { randomUUID } from "crypto";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Keycloak from "next-auth/providers/keycloak";
import type { JWT } from "next-auth/jwt";
import type { Provider } from "next-auth/providers";
import {
  isAuthCredentialsEnabled,
  isAuthOidcEnabled,
  keycloakProviderOptions,
} from "@/infrastructure/auth/oidc-config";
import {
  sessionTokenCookie,
  shouldUseSecureAuthCookies,
} from "@/infrastructure/auth/secure-cookies";
import { resolveActiveMembershipClaims } from "@/infrastructure/auth/membership-claims";
import {
  isSessionIdleExpired,
  nextLastActiveAt,
  resolveSessionIdleSec,
} from "@/infrastructure/auth/session-idle";
import { SESSION_MAX_AGE_SEC } from "@/infrastructure/auth/session-max-age";
import { prisma } from "@/infrastructure/db/prisma";
import { credentialsSchema } from "@/lib/auth/credentials";

export { SESSION_MAX_AGE_SEC } from "@/infrastructure/auth/session-max-age";
export {
  isAuthCredentialsEnabled,
  isAuthOidcEnabled,
} from "@/infrastructure/auth/oidc-config";

function emptyJwt(): JWT {
  return {};
}

function buildProviders(): Provider[] {
  const providers: Provider[] = [];

  if (isAuthCredentialsEnabled()) {
    providers.push(
      Credentials({
        id: "credentials",
        name: "Email e password",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        authorize: async (raw) => {
          const parsed = credentialsSchema.safeParse(raw);
          if (!parsed.success) return null;

          const email = parsed.data.email.toLowerCase();
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user?.passwordHash) return null;

          const valid = await bcrypt.compare(
            parsed.data.password,
            user.passwordHash,
          );
          if (!valid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        },
      }),
    );
  }

  if (isAuthOidcEnabled()) {
    providers.push(Keycloak(keycloakProviderOptions()));
  }

  if (providers.length === 0) {
    // Safety net for misconfigured prod — keep Credentials so app boots
    providers.push(
      Credentials({
        id: "credentials",
        name: "Email e password",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        authorize: async () => null,
      }),
    );
  }

  return providers;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  /**
   * Credentials richiede JWT a livello Auth.js; persistiamo comunque Session in
   * Postgres (token in JWT) per logout/revoke e AC T1.11. Stesso path per OIDC.
   */
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE_SEC },
  pages: {
    signIn: "/login",
  },
  providers: buildProviders(),
  callbacks: {
    async jwt({ token, user }): Promise<JWT> {
      const nowSec = Math.floor(Date.now() / 1000);

      if (user?.id) {
        const sessionToken = randomUUID();
        const expires = new Date(Date.now() + SESSION_MAX_AGE_SEC * 1000);
        await prisma.session.create({
          data: {
            sessionToken,
            userId: user.id,
            expires,
          },
        });

        // soft-disable membership → nessun claim tenant (T1.26)
        const claims = await resolveActiveMembershipClaims(user.id);

        return {
          ...token,
          sub: user.id,
          sessionToken,
          tenantId: claims.tenantId,
          role: claims.role,
          membershipId: claims.membershipId,
          lastActiveAt: nowSec,
        };
      }

      if (!token.sessionToken || !token.sub) {
        return emptyJwt();
      }

      const dbSession = await prisma.session.findUnique({
        where: { sessionToken: token.sessionToken },
      });
      if (!dbSession || dbSession.expires < new Date()) {
        if (dbSession) {
          await prisma.session
            .delete({ where: { id: dbSession.id } })
            .catch(() => {});
        }
        return emptyJwt();
      }

      const idleSec = resolveSessionIdleSec();
      if (
        isSessionIdleExpired(
          typeof token.lastActiveAt === "number"
            ? token.lastActiveAt
            : undefined,
          idleSec,
          nowSec,
        )
      ) {
        await prisma.session
          .delete({ where: { id: dbSession.id } })
          .catch(() => {});
        return emptyJwt();
      }

      // Re-check Membership.deletedAt on every refresh (not only login).
      const claims = await resolveActiveMembershipClaims(
        token.sub,
        typeof token.membershipId === "string" ? token.membershipId : undefined,
      );

      return {
        ...token,
        tenantId: claims.tenantId,
        role: claims.role,
        membershipId: claims.membershipId,
        lastActiveAt: nextLastActiveAt(
          typeof token.lastActiveAt === "number"
            ? token.lastActiveAt
            : undefined,
          nowSec,
        ),
      };
    },
    async session({ session, token }) {
      if (!token.sub || !token.sessionToken) {
        return {
          ...session,
          user: { ...session.user, id: "" },
          expires: new Date(0).toISOString(),
        };
      }
      session.user.id = token.sub;
      session.sessionToken = token.sessionToken;
      session.tenantId =
        typeof token.tenantId === "string" ? token.tenantId : undefined;
      session.role = token.role as Role | undefined;
      session.membershipId =
        typeof token.membershipId === "string" ? token.membershipId : undefined;
      return session;
    },
  },
  events: {
    async signOut(message) {
      const sessionToken =
        "token" in message && message.token?.sessionToken
          ? String(message.token.sessionToken)
          : null;
      if (sessionToken) {
        await prisma.session
          .deleteMany({ where: { sessionToken } })
          .catch(() => {});
      }
    },
  },
  cookies: {
    sessionToken: sessionTokenCookie(
      shouldUseSecureAuthCookies({
        NODE_ENV: process.env.NODE_ENV,
        AUTH_URL: process.env.AUTH_URL,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        FF_DOMAIN: process.env.FF_DOMAIN,
        AUTH_SECURE_COOKIES: process.env.AUTH_SECURE_COOKIES,
      }),
    ),
  },
  trustHost: true,
});
