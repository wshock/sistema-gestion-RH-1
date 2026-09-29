import { prisma } from "@/data/prisma";
import type { ReportTotals } from "@/features/reportes/types";

/**
 * Totales generales del sistema en una sola sentencia: tres `count(*)` sobre
 * la misma instantánea, sin traer registros al servidor. Un candidato está
 * pendiente mientras no tiene empleado asociado.
 */
export async function getReportTotals(): Promise<ReportTotals> {
  const filas = await prisma.$queryRaw<ReportTotals[]>`
    SELECT (SELECT count(*) FROM humanresources.employee WHERE currentflag = true)::int
             AS "activeEmployees",
           (SELECT count(*) FROM humanresources.department)::int
             AS "departments",
           (SELECT count(*) FROM humanresources.jobcandidate WHERE businessentityid IS NULL)::int
             AS "pendingCandidates"
  `;

  return filas[0] ?? { activeEmployees: 0, departments: 0, pendingCandidates: 0 };
}
