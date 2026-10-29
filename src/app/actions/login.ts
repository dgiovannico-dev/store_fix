"use server";

import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { checkRateLimit } from "@/infrastructure/rate-limit";
import { rateLimitKey } from "@/infrastructure/security/client-ip";

export async function loginAction(formData: FormData): Promise<void> {
  const limit = checkRateLimit(
    rateLimitKey("login", await headers()),
    10,
    15 * 60 * 1000,
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
