import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.string().trim().min(1, "Email obbligatoria").email("Email non valida"),
  password: z.string().min(8, "Password troppo corta"),
});

export type CredentialsInput = z.infer<typeof credentialsSchema>;
