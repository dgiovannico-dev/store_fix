"use server";

import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { sendEmailVerification } from "@/domain/tenancy/email-verification";
import { signupHqOwner } from "@/domain/tenancy/signup";
import { rateLimitedRetryMessage } from "@/infrastructure/rate-limit-action";
import { RATE_LIMIT } from "@/infrastructure/rate-limit-policies";
import { rateLimitKey } from "@/infrastructure/security/client-ip";
import { actionResultError, domainError } from "@/i18n/domain-errors";

export type SignupActionState = {
  error?: string;
};

export async function signupAction(
  _prev: SignupActionState,
  formData: FormData,
): Promise<SignupActionState> {
  // Dual bucket: per-IP + per-email (same opaque retry copy).
  const ipLimited = await rateLimitedRetryMessage(
    rateLimitKey("signup", await headers()),
    RATE_LIMIT.signup,
  );
  if (ipLimited) return { error: ipLimited };

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (email) {
    const emailLimited = await rateLimitedRetryMessage(
      `signup-user:${email}`,
      RATE_LIMIT.signupUser,
    );
    if (emailLimited) return { error: emailLimited };
  }

  const password = String(formData.get("password") ?? "");
  const result = await signupHqOwner({
    name: String(formData.get("name") ?? ""),
    email,
    password,
    workspaceName: String(formData.get("workspaceName") ?? ""),
  });

  if (!result.ok) {
    return { error: await actionResultError(result) };
  }

  try {
    await sendEmailVerification(result.email);
  } catch (e) {
    console.error("[signup] verify email enqueue failed", e);
  }

  try {
    await signIn("credentials", {
      email: result.email,
      password,
      redirectTo: "/onboarding",
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: await domainError("signupAutoLoginFailed") };
    }
    throw e;
  }

  redirect("/onboarding");
}
