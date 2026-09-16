import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/data/prisma";
import type { TransferLogQuery } from "@/features/procesos/schemas";
import type { TransferLogRow } from "@/features/procesos/types";

type TransferLogFilter = Omit<TransferLogQuery, "page">;

function condiciones({ departmentId, shiftId, from, to }: TransferLogFilter): Prisma.Sql {
  const partes: Prisma.Sql[] = [];

  if (departmentId !== undefined) {
    partes.push(Prisma.sql`edh.departmentid = ${departmentId}`);
  }

  if (shiftId !== undefined) {
    partes.push(Prisma.sql`edh.shiftid = ${shiftId}`);
  }

  if (from !== undefined) {
    partes.push(Prisma.sql`edh.startdate >= CAST(${from} AS date)`);
  }

  if (to !== undefined) {
    partes.push(Prisma.sql`edh.startdate <= CAST(${to} AS date)`);
  }

  return partes.length > 0 ? Prisma.join(partes, " AND ") : Prisma.sql`TRUE`;
}

export async function listTransferLog({
  skip,
  take,
  ...filtro
}: TransferLogFilter & { skip: number; take: number }): Promise<TransferLogRow[]> {
  const where = condiciones(filtro);

  return prisma.$queryRaw<TransferLogRow[]>`
    SELECT edh.businessentityid AS "businessEntityId",
           p.firstname || ' ' || p.lastname AS "employeeName",
           d.name AS "departmentName",
           s.name AS "shiftName",
           to_char(edh.startdate, 'YYYY-MM-DD') AS "startDate",
           to_char(edh.enddate, 'YYYY-MM-DD') AS "endDate"
    FROM humanresources.employeedepartmenthistory edh
    JOIN humanresources.employee e ON e.businessentityid = edh.businessentityid
    JOIN person.person p ON p.businessentityid = e.businessentityid
    JOIN humanresources.department d ON d.departmentid = edh.departmentid
    JOIN humanresources.shift s ON s.shiftid = edh.shiftid
    WHERE ${where}
    ORDER BY edh.startdate DESC, edh.businessentityid ASC, edh.departmentid ASC
    LIMIT ${take} OFFSET ${skip}
  `;
}

export async function countTransferLog(filtro: TransferLogFilter): Promise<number> {
  const where = condiciones(filtro);
  const filas = await prisma.$queryRaw<{ total: number }[]>`
    SELECT count(*)::int AS total
    FROM humanresources.employeedepartmenthistory edh
    WHERE ${where}
  `;

  return filas[0]?.total ?? 0;
}
