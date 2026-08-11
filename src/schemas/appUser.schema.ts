import { z } from "zod";

export const newAppUserSchema = z.object({
  email: z.email({ error: "El correo no tiene un formato válido." }).trim().toLowerCase(),
  password: z
    .string()
    .min(8, { error: "La contraseña debe tener al menos 8 caracteres." })
    .max(72, { error: "La contraseña no puede exceder 72 caracteres." }),
  name: z
    .string()
    .trim()
    .min(2, { error: "El nombre debe tener al menos 2 caracteres." }),
});

export type NewAppUser = z.infer<typeof newAppUserSchema>;
