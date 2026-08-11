"use server";

import { AuthError } from "next-auth";

import { signIn } from "@/auth";
import { credentialsSchema } from "@/schemas/auth.schema";

/**
 * Mensaje único para cualquier credencial rechazada: no distingue entre correo
 * inexistente y contraseña incorrecta, para no facilitar la enumeración de
 * usuarios.
 */
const INVALID_CREDENTIALS = "Correo o contraseña incorrectos.";

export type LoginFormState = { error: string } | undefined;

const DESTINO_POR_DEFECTO = "/inicio";

/**
 * Acepta solo rutas internas. Sin este filtro, un enlace con
 * `?redirectTo=https://sitio-falso` convertiría el login en un redirector
 * abierto, útil para phishing.
 */
function destinoSeguro(valor: FormDataEntryValue | null): string {
  if (typeof valor !== "string" || !valor.startsWith("/") || valor.startsWith("//")) {
    return DESTINO_POR_DEFECTO;
  }

  return valor;
}

export async function login(
  _previousState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: INVALID_CREDENTIALS };
  }

  try {
    await signIn("credentials", {
      ...parsed.data,
      redirectTo: destinoSeguro(formData.get("redirectTo")),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: INVALID_CREDENTIALS };
    }

    // La redirección exitosa de `signIn` también viaja como excepción: hay que
    // dejarla pasar para que Next.js la procese.
    throw error;
  }

  return undefined;
}
