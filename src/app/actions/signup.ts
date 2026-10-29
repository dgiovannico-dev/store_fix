"use server";

import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { sendEmailVerification } from "@/domain/tenancy/email-verification";
import { signupHqOwner } from "@/domain/tenancy/signup";
import { checkRateLimit } from "@/infrastructure/rate-limit";

export type SignupActionState = {
  error?: string;
};

export async function signupAction(
  _prev: SignupActionState,
  formData: FormData,
): Promise<SignupActionState> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = fwd || h.get("x-real-ip") || "local";
  const limit = checkRateLimit(`signup:${ip}`, 10, 15 * 60 * 1000);
  if (!limit.ok) {
    return {
      error: `Troppi tentativi. Riprova tra ${limit.retryAfterSec} secondi.`,
    };
  }

  const password = String(formData.get("password") ?? "");
  const result = await signupHqOwner({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password,
    workspaceName: String(formData.get("workspaceName") ?? ""),
  });

  if (!result.ok) {
    return { error: result.message };
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
      return {
        error:
          "Workspace creato, ma accesso automatico non riuscito. Prova ad accedere.",
      };
    }
    throw e;
  }

  redirect("/onboarding");
}
