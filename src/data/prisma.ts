import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Cliente Prisma único para todo el proceso.
 *
 * La base es el pooler de Supabase (Supavisor) en *session mode*: cada conexión
 * del pool de `pg` retiene un backend de Postgres durante toda su vida y
 * Supavisor limita la app a 15 clientes. Sin acotar el pool, `pg` abre hasta 10
 * conexiones por `PrismaClient`, y en `next dev` cada recompilación de Turbopack
 * —y cada worker de render— evaluaba de nuevo este módulo creando pools
 * paralelos que agotaban el límite (`EMAXCONNSESSION`) al paginar rápido.
 *
 * Dos medidas lo evitan:
 *  1. Un pool explícito y pequeño, con cierre de conexiones ociosas.
 *  2. Cachear pool y cliente en `globalThis` en todos los entornos, para que el
 *     HMR reutilice la misma instancia en vez de acumular pools.
 */

declare global {
  var prismaGlobal: PrismaClient | undefined;
  var pgPoolGlobal: pg.Pool | undefined;
}

const pool =
  globalThis.pgPoolGlobal ??
  new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 4,
    idleTimeoutMillis: 10_000,
    allowExitOnIdle: true,
  });

const adapter = new PrismaPg(pool);

export const prisma = globalThis.prismaGlobal ?? new PrismaClient({ adapter });

globalThis.pgPoolGlobal = pool;
globalThis.prismaGlobal = prisma;
