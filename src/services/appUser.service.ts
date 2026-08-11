import { upsertAppUserByEmail } from "@/data/appUser";
import { hashPassword } from "@/lib/password";
import type { NewAppUser } from "@/schemas/appUser.schema";

/**
 * Crea el usuario, o actualiza su nombre y contraseña si el correo ya existe.
 * Es idempotente para que la carga inicial pueda repetirse sin fallar por la
 * restricción de unicidad del correo.
 */
export async function provisionAppUser({ email, password, name }: NewAppUser) {
  const passwordHash = await hashPassword(password);

  return upsertAppUserByEmail({ email, passwordHash, name });
}
