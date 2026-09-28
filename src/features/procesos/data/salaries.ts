import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/data/prisma";
import type { SalaryLogQuery } from "@/features/procesos/schemas";
import type { SalaryLogRow } from "@/features/procesos/types";

type SalaryLogFilter = Omit<SalaryLogQuery, "page">;

function condiciones({ q, from, to }: SalaryLogFilter): Prisma.Sql {
  const partes: Prisma.Sql[] = [];

  if (q) {
    const patron = `%${q.replace(/([\\%_])/g, "\\$1")}%`;
    partes.push(Prisma.sql`unaccent(h.employee_name) ILIKE unaccent(${patron})`);
  }

  if (from !== undefined) {
    partes.push(Prisma.sql`h.rate_change_date >= CAST(${from} AS date)`);
  }

  if (to !== undefined) {
    partes.push(Prisma.sql`h.rate_change_date < CAST(${to} AS date) + INTERVAL '1 day'`);
  }

  return partes.length > 0 ? Prisma.join(partes, " AND ") : Prisma.sql`TRUE`;
}

const historial = Prisma.sql`
  SELECT eph.businessentityid,
         p.firstname || ' ' || p.lastname AS employee_name,
         eph.rate::float8 AS rate,
         eph.payfrequency,
         eph.ratechangedate AS rate_change_date,
         ROW_NUMBER() OVER (
           PARTITION BY eph.businessentityid
           ORDER BY eph.ratechangedate DESC
         ) AS position
  FROM humanresources.employeepayhistory eph
  JOIN humanresources.employee e ON e.businessentityid = eph.businessentityid
  JOIN person.person p ON p.businessentityid = e.businessentityid
`;

export async function listSalaryLog({
  skip,
  take,
  ...filtro
}: SalaryLogFilter & { skip: number; take: number }): Promise<SalaryLogRow[]> {
  const where = condiciones(filtro);

  return prisma.$queryRaw<SalaryLogRow[]>`
    WITH historial AS (${historial})
    SELECT businessentityid AS "businessEntityId",
           employee_name AS "employeeName",
           rate AS "rate",
           payfrequency AS "payFrequency",
           rate_change_date AS "rateChangeDate",
           position = 1 AS "current"
    FROM historial h
    WHERE ${where}
    ORDER BY rate_change_date DESC, businessentityid ASC
    LIMIT ${take} OFFSET ${skip}
  `;
}

export async function countSalaryLog(filtro: SalaryLogFilter): Promise<number> {
  const where = condiciones(filtro);
  const filas = await prisma.$queryRaw<{ total: number }[]>`
    WITH historial AS (${historial})
    SELECT count(*)::int AS total
    FROM historial h
    WHERE ${where}
  `;

  return filas[0]?.total ?? 0;
}
