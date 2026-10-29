"use server";

import { acceptInvite } from "@/domain/invites/invite";
import { actionResultError } from "@/i18n/domain-errors";

export async function acceptInviteAction(input: {
  token: string;
  name: string;
  password: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const result = await acceptInvite({
    rawToken: input.token,
    name: input.name,
    password: input.password,
  });
  if (!result.ok) {
    return { ok: false, message: await actionResultError(result) };
  }
  return { ok: true };
}
