"use server";

import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { RATE_LIMIT } from "@/infrastructure/rate-limit-policies";
import { redirectIfRateLimited } from "@/infrastructure/rate-limit-redirect";
import { rateLimitKey } from "@/infrastructure/security/client-ip";

const LOGIN_RATE_LIMIT_PATH = "/login?error=RateLimit";

export async function loginAction(formData: FormData): Promise<void> {
  // Dual bucket (OWASP bot cheat sheet): per-IP + per-email, same opaque redirect.
  await redirectIfRateLimited(
    rateLimitKey("login", await headers()),
    RATE_LIMIT.login,
    LOGIN_RATE_LIMIT_PATH,
  );

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (email) {
    await redirectIfRateLimited(
      `login-user:${email}`,
      RATE_LIMIT.loginUser,
      LOGIN_RATE_LIMIT_PATH,
    );
  }

  const callbackUrl = String(formData.get("callbackUrl") || "/onboarding");
  try {
    await signIn("credentials", {
      email,
      password: String(formData.get("password") ?? ""),
      redirectTo: callbackUrl,
    });
  } catch (e) {
    if (e instanceof AuthError) {
      redirect(`/login?error=${e.type}`);
    }
    throw e;
  }
}
