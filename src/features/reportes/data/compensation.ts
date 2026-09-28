import { prisma } from "@/data/prisma";
import type { AverageSalaryByDepartmentRow } from "@/features/reportes/types";

/**
 * Consultas del reporte de compensación.
 *
 * El salario vigente no está denormalizado: hay que tomarlo del registro de
 * `EmployeePayHistory` con `rateChangeDate` más reciente. La asignación
 * vigente es la fila de `EmployeeDepartmentHistory` sin `endDate` (si hubiera
 * más de una abierta, la de `startDate` más reciente). Todo se resuelve en
 * SQL —DISTINCT ON + agregación— para no traer el historial completo a memoria.
 *
 * Empleados sin historial salarial: se cuentan en `employeeCount` y en
 * `withoutPayCount`, pero no aportan a AVG / MIN / MAX (las agregaciones de
 * PostgreSQL ignoran NULL). Queda documentado en la UI cuando el conteo > 0.
 */

type AverageSalaryRawRow = {
  departmentId: number;
  name: string;
  groupName: string;
  employeeCount: number;
  withoutPayCount: number;
  averageRate: unknown;
  minRate: unknown;
  maxRate: unknown;
};

function aNumeroONulo(valor: unknown): number | null {
  if (valor === null || valor === undefined) {
    return null;
  }

  const numero = typeof valor === "number" ? valor : Number(valor);

  return Number.isFinite(numero) ? numero : null;
}

/**
 * Salario promedio, mínimo y máximo por departamento, solo empleados activos.
 *
 * Incluye todos los departamentos del catálogo: los sin empleados activos
 * llegan con `employeeCount = 0` y tarifas en `null`.
 */
export async function listAverageSalaryByDepartment(): Promise<
  AverageSalaryByDepartmentRow[]
> {
  const filas = await prisma.$queryRaw<AverageSalaryRawRow[]>`
    WITH salario_vigente AS (
      SELECT DISTINCT ON (businessentityid)
             businessentityid,
             rate
      FROM humanresources.employeepayhistory
      ORDER BY businessentityid, ratechangedate DESC
    ),
    asignacion_vigente AS (
      SELECT DISTINCT ON (businessentityid)
             businessentityid,
             departmentid
      FROM humanresources.employeedepartmenthistory
      WHERE enddate IS NULL
      ORDER BY businessentityid, startdate DESC
    )
    SELECT d.departmentid                                              AS "departmentId",
           d.name                                                      AS "name",
           d.groupname                                                 AS "groupName",
           count(e.businessentityid)::int                              AS "employeeCount",
           count(e.businessentityid)
             FILTER (WHERE sv.rate IS NULL)::int                       AS "withoutPayCount",
           avg(sv.rate)::double precision                              AS "averageRate",
           min(sv.rate)::double precision                              AS "minRate",
           max(sv.rate)::double precision                              AS "maxRate"
    FROM humanresources.department d
    LEFT JOIN asignacion_vigente av
      ON av.departmentid = d.departmentid
    LEFT JOIN humanresources.employee e
      ON e.businessentityid = av.businessentityid
     AND e.currentflag = true
    LEFT JOIN salario_vigente sv
      ON sv.businessentityid = e.businessentityid
    GROUP BY d.departmentid, d.name, d.groupname
    ORDER BY d.name ASC
  `;

  return filas.map((fila) => ({
    departmentId: fila.departmentId,
    name: fila.name,
    groupName: fila.groupName,
    employeeCount: fila.employeeCount,
    withoutPayCount: fila.withoutPayCount,
    averageRate: aNumeroONulo(fila.averageRate),
    minRate: aNumeroONulo(fila.minRate),
    maxRate: aNumeroONulo(fila.maxRate),
  }));
}
