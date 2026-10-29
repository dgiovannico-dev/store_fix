import { z } from "zod";

/** Messaggi = chiavi `domainErrors` (se esposti al boundary). */
export const credentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "credentialsEmailRequired")
    .email("signupEmailInvalid"),
  password: z.string().min(8, "passwordTooShort"),
});

export type CredentialsInput = z.infer<typeof credentialsSchema>;
