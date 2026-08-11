import { z } from "zod";

/**
 * Credenciales de inicio de sesión. No valida complejidad de contraseña: al
 * autenticar solo interesa que venga algo, las reglas de fortaleza aplican al
 * crear el usuario (ver `appUser.schema.ts`).
 *
 * Los mensajes están redactados para mostrarse tal cual en el formulario: el
 * mismo esquema valida en el cliente —donde el texto se ve— y en la Server
 * Action, que es la que de verdad decide.
 */
export const credentialsSchema = z.object({
  email: z
    .string({ error: "Ingresá tu correo electrónico." })
    .trim()
    .min(1, { error: "Ingresá tu correo electrónico." })
    .pipe(z.email({ error: "Escribí un correo válido, por ejemplo nombre@empresa.com." }))
    .transform((valor) => valor.toLowerCase()),
  password: z
    .string({ error: "Ingresá tu contraseña." })
    .min(1, { error: "Ingresá tu contraseña." }),
});

export type Credentials = z.infer<typeof credentialsSchema>;
