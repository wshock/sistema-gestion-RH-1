"use server";

import { signOut } from "@/auth";

/**
 * Cierra la sesión invalidando la cookie que la contiene, de modo que el token
 * anterior deja de ser aceptado, y devuelve al login.
 */
export async function logout() {
  await signOut({ redirectTo: "/login" });
}
