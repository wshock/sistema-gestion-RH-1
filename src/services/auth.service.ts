import { randomBytes } from "node:crypto";

import { findAppUserByEmail } from "@/data/appUser";
import { hashPassword, verifyPassword } from "@/lib/password";
import { credentialsSchema } from "@/schemas/auth.schema";

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
};

let placeholderHash: Promise<string> | undefined;

/**
 * Hash de descarte contra el que se compara cuando el correo no existe, para
 * que fallar por correo inexistente cueste lo mismo que fallar por contraseña
 * incorrecta. Sin esto, la diferencia de tiempo permitiría enumerar usuarios.
 */
function getPlaceholderHash(): Promise<string> {
  placeholderHash ??= hashPassword(randomBytes(32).toString("hex"));
  return placeholderHash;
}

/**
 * Valida un par correo/contraseña contra `AppUser`.
 *
 * Recibe `unknown` a propósito: el endpoint de credenciales es público, así que
 * valida su entrada aunque quien la envíe ya lo haya hecho. Devuelve `null`
 * ante cualquier fallo —correo inexistente, contraseña incorrecta o entrada
 * malformada— para que quien la invoque no pueda construir un mensaje que
 * distinga entre esos casos.
 */
export async function verifyCredentials(
  input: unknown,
): Promise<AuthenticatedUser | null> {
  const parsed = credentialsSchema.safeParse(input);

  if (!parsed.success) {
    return null;
  }

  const { email, password } = parsed.data;
  const user = await findAppUserByEmail(email);

  if (!user) {
    await verifyPassword(password, await getPlaceholderHash());
    return null;
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);

  if (!passwordMatches) {
    return null;
  }

  return { id: user.id, email: user.email, name: user.name };
}
