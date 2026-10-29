"use server";

import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { checkRateLimitPolicyAsync } from "@/infrastructure/rate-limit-async";
import { RATE_LIMIT } from "@/infrastructure/rate-limit-policies";
import { rateLimitKey } from "@/infrastructure/security/client-ip";

export async function loginAction(formData: FormData): Promise<void> {
  const limit = await checkRateLimitPolicyAsync(
    rateLimitKey("login", await headers()),
    RATE_LIMIT.login,
  );
  if (!limit.ok) {
    redirect(`/login?error=RateLimit`);
  }

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
