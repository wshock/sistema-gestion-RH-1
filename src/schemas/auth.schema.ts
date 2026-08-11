import { z } from "zod";

/**
 * Credenciales de inicio de sesión. No valida complejidad de contraseña: al
 * autenticar solo interesa que venga algo, las reglas de fortaleza aplican al
 * crear el usuario (ver `appUser.schema.ts`).
 */
export const credentialsSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1),
});

export type Credentials = z.infer<typeof credentialsSchema>;
