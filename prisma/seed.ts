/**
 * Carga inicial: crea el primer usuario administrador, sin el cual no habría
 * forma de entrar al sistema.
 *
 * Las credenciales llegan por variables de entorno (nunca escritas en el
 * código) y la contraseña se guarda hasheada. Es idempotente: volver a
 * ejecutarlo actualiza el nombre y la contraseña del mismo correo.
 *
 * Uso: npm run seed
 */
import "dotenv/config";

import { prisma } from "../src/data/prisma";
import { newAppUserSchema } from "../src/schemas/appUser.schema";
import { provisionAppUser } from "../src/services/appUser.service";

const REQUIRED_VARS = [
  "SEED_ADMIN_EMAIL",
  "SEED_ADMIN_PASSWORD",
  "SEED_ADMIN_NAME",
] as const;

async function main() {
  const missing = REQUIRED_VARS.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno para la carga inicial: ${missing.join(", ")}.\n` +
        `Definilas en .env (ver .env.example) antes de correr el seed.`,
    );
  }

  const admin = newAppUserSchema.parse({
    email: process.env.SEED_ADMIN_EMAIL,
    password: process.env.SEED_ADMIN_PASSWORD,
    name: process.env.SEED_ADMIN_NAME,
  });

  const user = await provisionAppUser(admin);

  console.log(`Usuario administrador listo: ${user.email} (id ${user.id})`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
