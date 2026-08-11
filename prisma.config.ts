import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
  experimental: {
    externalTables: true,
  },
  // Las tablas de AdventureWorks las carga pgloader (ver migration/), no
  // Prisma Migrate. Declararlas externas las mantiene en el cliente tipado
  // pero fuera de las migraciones: estas solo gestionan el esquema `app`.
  tables: {
    external: [
      "humanresources.department",
      "humanresources.employee",
      "humanresources.employeedepartmenthistory",
      "humanresources.employeepayhistory",
      "humanresources.jobcandidate",
      "humanresources.shift",
      "person.businessentity",
      "person.person",
    ],
  },
});
