"use server";

import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { checkRateLimit } from "@/infrastructure/rate-limit";

async function clientKey(prefix: string): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = fwd || h.get("x-real-ip") || "local";
  return `${prefix}:${ip}`;
}

export async function loginAction(formData: FormData): Promise<void> {
  const limit = checkRateLimit(await clientKey("login"), 10, 15 * 60 * 1000);
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
