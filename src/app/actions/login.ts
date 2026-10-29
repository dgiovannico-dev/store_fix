"use server";

import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { redirectIfRateLimited } from "@/infrastructure/rate-limit-redirect";
import { RATE_LIMIT } from "@/infrastructure/rate-limit-policies";
import { rateLimitKey } from "@/infrastructure/security/client-ip";

export async function loginAction(formData: FormData): Promise<void> {
  await redirectIfRateLimited(
    rateLimitKey("login", await headers()),
    RATE_LIMIT.login,
    "/login?error=RateLimit",
  );

  const callbackUrl = String(formData.get("callbackUrl") || "/onboarding");
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
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
