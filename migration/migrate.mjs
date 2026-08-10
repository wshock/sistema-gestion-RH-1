#!/usr/bin/env node
/**
 * migrate.mjs
 *
 * Migra los esquemas HumanResources y Person de AdventureWorks (SQL Server)
 * hacia PostgreSQL (Supabase), de forma reproducible en Windows, macOS y Linux.
 *
 * Requiere:
 *   - Node.js (ya es dependencia del proyecto)
 *   - Docker Desktop corriendo
 *   - Variables de entorno MSSQL_URI y PG_URI
 *
 * Uso (macOS/Linux):
 *   export MSSQL_URI="mssql://usuario:password@host:1433/AdventureWorks2022"
 *   export PG_URI="postgresql://usuario:password@host:5432/postgres"
 *   node migrate.mjs
 *
 * Uso (Windows PowerShell):
 *   $env:MSSQL_URI="mssql://usuario:password@host:1433/AdventureWorks2022"
 *   $env:PG_URI="postgresql://usuario:password@host:5432/postgres"
 *   node migrate.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const MSSQL_URI = process.env.MSSQL_URI;
const PG_URI = process.env.PG_URI;

if (!MSSQL_URI || !PG_URI) {
  console.error("Faltan variables de entorno: MSSQL_URI y PG_URI son obligatorias.");
  process.exit(1);
}

// 1. Generar adventureworks.load a partir del template (reemplazo de envsubst)
console.log("==> Generando adventureworks.load a partir de la plantilla...");
const templatePath = join(__dirname, "adventureworks.load.template");
const outputPath = join(__dirname, "adventureworks.load");

const template = readFileSync(templatePath, "utf8");
const rendered = template
  .replaceAll("${MSSQL_URI}", MSSQL_URI)
  .replaceAll("${PG_URI}", PG_URI);

writeFileSync(outputPath, rendered, "utf8");

// 2. Correr pgloader
console.log("==> Ejecutando pgloader (carga de datos y tablas)...");
const pgloaderResult = spawnSync(
  "docker",
  [
    "run",
    "--rm",
    "--platform",
    "linux/amd64",
    "-e",
    "TDS_MAX_CONN=100",
    "-v",
    `${__dirname}:/migration`,
    "dimitri/pgloader:latest",
    "pgloader",
    "/migration/adventureworks.load",
  ],
  { stdio: "inherit" }
);

if (pgloaderResult.status !== 0) {
  console.error("pgloader terminó con errores. Revisa el log antes de continuar.");
  process.exit(pgloaderResult.status ?? 1);
}

// 3. Aplicar primary keys y foreign keys
console.log("==> Aplicando primary keys y foreign keys (post_migration_constraints.sql)...");
const psqlResult = spawnSync(
  "docker",
  [
    "run",
    "--rm",
    "--platform",
    "linux/amd64",
    "-v",
    `${__dirname}:/migration`,
    "postgres:16",
    "psql",
    PG_URI,
    "-f",
    "/migration/post_migration_constraints.sql",
  ],
  { stdio: "inherit" }
);

if (psqlResult.status !== 0) {
  console.error("Falló la aplicación de constraints.");
  process.exit(psqlResult.status ?? 1);
}

// 4. Ajustar secuencias autoincrementales y verificar con inserts de prueba
console.log("==> Ajustando secuencias autoincrementales (reset_sequences.sql)...");
const sequencesResult = spawnSync(
  "docker",
  [
    "run",
    "--rm",
    "--platform",
    "linux/amd64",
    "-v",
    `${__dirname}:/migration`,
    "postgres:16",
    "psql",
    PG_URI,
    "-f",
    "/migration/reset_sequences.sql",
  ],
  { stdio: "inherit" }
);

if (sequencesResult.status !== 0) {
  console.error("Falló el ajuste de secuencias.");
  process.exit(sequencesResult.status ?? 1);
}

console.log("==> Migración completa.");
