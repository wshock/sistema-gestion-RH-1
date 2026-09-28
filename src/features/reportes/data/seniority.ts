import { prisma } from "@/data/prisma";
import type {
  SeniorityBracketId,
  SeniorityBracketRow,
  SeniorityEmployeeRow,
} from "@/features/reportes/types";

/**
 * Consultas del reporte de antigüedad.
 *
 * Los años se calculan en PostgreSQL con `age(CURRENT_DATE, hiredate)` para
 * que la cifra sea respecto a “hoy” en cada consulta, no a una fecha fijada
 * en el código. Las contrataciones antiguas de AdventureWorks producen
 * antigüedades elevadas: es el dato real, no un error a corregir.
 *
 * Tramos (años cumplidos):
 * - menos de 5
 * - 5 a 9
 * - 10 a 14
 * - 15 a 19
 * - 20 o más
 */

/** Orden y etiquetas fijos: el resumen siempre muestra los cinco tramos. */
const TRAMOS: readonly {
  bracketId: SeniorityBracketId;
  label: string;
}[] = [
  { bracketId: "lt5", label: "Menos de 5 años" },
  { bracketId: "y5to9", label: "5 a 9 años" },
  { bracketId: "y10to14", label: "10 a 14 años" },
  { bracketId: "y15to19", label: "15 a 19 años" },
  { bracketId: "y20plus", label: "20 años o más" },
];

type SeniorityRawRow = {
  businessEntityId: number;
  firstName: string;
  lastName: string;
  jobTitle: string;
  hireDate: string;
  yearsOfService: number;
};

type BracketCountRow = {
  bracketId: string;
  employeeCount: number;
};

export async function countActiveEmployees(): Promise<number> {
  const filas = await prisma.$queryRaw<{ total: number }[]>`
    SELECT count(*)::int AS total
    FROM humanresources.employee
    WHERE currentflag = true
  `;

  return filas[0]?.total ?? 0;
}

/**
 * Empleados activos ordenados por fecha de contratación ascendente
 * (más antiguos primero), con años cumplidos a la fecha actual.
 */
export async function listSeniorityEmployees({
  skip,
  take,
}: {
  skip: number;
  take: number;
}): Promise<SeniorityEmployeeRow[]> {
  const filas = await prisma.$queryRaw<SeniorityRawRow[]>`
    SELECT e.businessentityid                                    AS "businessEntityId",
           p.firstname                                           AS "firstName",
           p.lastname                                            AS "lastName",
           e.jobtitle                                            AS "jobTitle",
           to_char(e.hiredate, 'YYYY-MM-DD')                     AS "hireDate",
           EXTRACT(YEAR FROM age(CURRENT_DATE, e.hiredate))::int AS "yearsOfService"
    FROM humanresources.employee e
    JOIN person.person p ON p.businessentityid = e.businessentityid
    WHERE e.currentflag = true
    ORDER BY e.hiredate ASC, p.lastname ASC, p.firstname ASC
    LIMIT ${take} OFFSET ${skip}
  `;

  return filas;
}

/**
 * Distribución por tramos. Devuelve siempre los cinco tramos, aunque alguno
 * tenga cero empleados, para que el resumen no “desaparezca” tramos vacíos.
 */
export async function listSeniorityBrackets(): Promise<SeniorityBracketRow[]> {
  const filas = await prisma.$queryRaw<BracketCountRow[]>`
    SELECT CASE
             WHEN EXTRACT(YEAR FROM age(CURRENT_DATE, e.hiredate))::int < 5
               THEN 'lt5'
             WHEN EXTRACT(YEAR FROM age(CURRENT_DATE, e.hiredate))::int < 10
               THEN 'y5to9'
             WHEN EXTRACT(YEAR FROM age(CURRENT_DATE, e.hiredate))::int < 15
               THEN 'y10to14'
             WHEN EXTRACT(YEAR FROM age(CURRENT_DATE, e.hiredate))::int < 20
               THEN 'y15to19'
             ELSE 'y20plus'
           END AS "bracketId",
           count(*)::int AS "employeeCount"
    FROM humanresources.employee e
    WHERE e.currentflag = true
    GROUP BY 1
  `;

  const porId = new Map(filas.map((fila) => [fila.bracketId, fila.employeeCount]));

  return TRAMOS.map((tramo) => ({
    bracketId: tramo.bracketId,
    label: tramo.label,
    employeeCount: porId.get(tramo.bracketId) ?? 0,
  }));
}
