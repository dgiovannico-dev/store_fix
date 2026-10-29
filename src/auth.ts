import { randomUUID } from "crypto";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";
import {
  sessionTokenCookie,
  shouldUseSecureAuthCookies,
} from "@/infrastructure/auth/secure-cookies";
import { SESSION_MAX_AGE_SEC } from "@/infrastructure/auth/session-max-age";
import { prisma } from "@/infrastructure/db/prisma";
import { credentialsSchema } from "@/lib/auth/credentials";

export { SESSION_MAX_AGE_SEC } from "@/infrastructure/auth/session-max-age";

function emptyJwt(): JWT {
  return {};
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  /**
   * Credentials richiede JWT a livello Auth.js; persistiamo comunque Session in
   * Postgres (token in JWT) per logout/revoke e AC T1.11.
   */
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE_SEC },
  pages: {
    signIn: "/login",
  },
  providers: [
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
  ],
  callbacks: {
    async jwt({ token, user }): Promise<JWT> {
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

        const membership = await prisma.membership.findFirst({
          where: { userId: user.id, deletedAt: null },
          orderBy: { createdAt: "asc" },
        });
        // soft-disable membership → nessun claim tenant (T1.26)

        return {
          ...token,
          sub: user.id,
          sessionToken,
          tenantId: membership?.tenantId,
          role: membership?.role,
          membershipId: membership?.id,
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

      return token;
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
