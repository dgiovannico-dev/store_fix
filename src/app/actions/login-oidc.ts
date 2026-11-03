"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";

/** Keycloak OIDC — F4-04. Rate limit resta sul form Credentials. */
export async function loginOidcAction(formData: FormData): Promise<void> {
  const callbackUrl = String(formData.get("callbackUrl") ?? "/onboarding");
  try {
    await signIn("keycloak", { redirectTo: callbackUrl });
  } catch (e) {
    if (e instanceof AuthError) {
      redirect(`/login?error=${e.type}`);
    }
    throw e;
  }
}
