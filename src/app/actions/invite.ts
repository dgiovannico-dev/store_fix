"use server";

import { acceptInvite } from "@/domain/invites/invite";

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
    return { ok: false, message: result.message };
  }
  return { ok: true };
}
