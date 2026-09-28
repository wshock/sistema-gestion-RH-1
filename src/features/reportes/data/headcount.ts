import { prisma } from "@/data/prisma";

/**
 * Consultas del reporte de plantilla (headcount).
 *
 * Criterio común: empleados con `currentflag = true` y su asignación vigente,
 * la fila de `EmployeeDepartmentHistory` sin `endDate` (si hubiera más de una
 * abierta, la de `startDate` más reciente). Cada consulta devuelve, en la misma
 * sentencia, una fila extra con id `NULL` que cuenta a los activos sin
 * asignación vigente: no desaparecen del total y se muestran aparte.
 */

type DepartmentCountRaw = {
  departmentId: number | null;
  name: string | null;
  groupName: string | null;
  employeeCount: number;
};

type ShiftCountRaw = {
  shiftId: number | null;
  name: string | null;
  startTime: string | null;
  endTime: string | null;
  crossesMidnight: boolean | null;
  employeeCount: number;
};

export type GroupCounts<Row> = { rows: Row[]; unassignedCount: number };

function separarSinAsignacion<Raw extends { employeeCount: number }, Row>(
  filas: Raw[],
  esSinAsignacion: (fila: Raw) => boolean,
  mapear: (fila: Raw) => Row,
): GroupCounts<Row> {
  let unassignedCount = 0;
  const rows: Row[] = [];

  for (const fila of filas) {
    if (esSinAsignacion(fila)) {
      unassignedCount = fila.employeeCount;
    } else {
      rows.push(mapear(fila));
    }
  }

  return { rows, unassignedCount };
}

/** Todos los departamentos, incluidos los vacíos con 0, por conteo descendente. */
export async function countActiveEmployeesByDepartment(): Promise<
  GroupCounts<{
    departmentId: number;
    name: string;
    groupName: string;
    employeeCount: number;
  }>
> {
  const filas = await prisma.$queryRaw<DepartmentCountRaw[]>`
    WITH activos AS (
      SELECT businessentityid
      FROM humanresources.employee
      WHERE currentflag = true
    ),
    asignacion_vigente AS (
      SELECT DISTINCT ON (edh.businessentityid)
             edh.businessentityid,
             edh.departmentid
      FROM humanresources.employeedepartmenthistory edh
      JOIN activos a ON a.businessentityid = edh.businessentityid
      WHERE edh.enddate IS NULL
      ORDER BY edh.businessentityid, edh.startdate DESC
    )
    SELECT d.departmentid::int                AS "departmentId",
           d.name                             AS "name",
           d.groupname                        AS "groupName",
           count(av.businessentityid)::int    AS "employeeCount"
    FROM humanresources.department d
    LEFT JOIN asignacion_vigente av ON av.departmentid = d.departmentid
    GROUP BY d.departmentid, d.name, d.groupname
    UNION ALL
    SELECT NULL, NULL, NULL, count(*)::int
    FROM activos a
    WHERE NOT EXISTS (
      SELECT 1 FROM asignacion_vigente av WHERE av.businessentityid = a.businessentityid
    )
    ORDER BY "employeeCount" DESC, "name" ASC
  `;

  return separarSinAsignacion(
    filas,
    (fila) => fila.departmentId === null,
    (fila) => ({
      departmentId: fila.departmentId!,
      name: fila.name!,
      groupName: fila.groupName!,
      employeeCount: fila.employeeCount,
    }),
  );
}

/** Todos los turnos, incluidos los vacíos con 0, con su horario en `HH:MM`. */
export async function countActiveEmployeesByShift(): Promise<
  GroupCounts<{
    shiftId: number;
    name: string;
    startTime: string;
    endTime: string;
    crossesMidnight: boolean;
    employeeCount: number;
  }>
> {
  const filas = await prisma.$queryRaw<ShiftCountRaw[]>`
    WITH activos AS (
      SELECT businessentityid
      FROM humanresources.employee
      WHERE currentflag = true
    ),
    asignacion_vigente AS (
      SELECT DISTINCT ON (edh.businessentityid)
             edh.businessentityid,
             edh.shiftid
      FROM humanresources.employeedepartmenthistory edh
      JOIN activos a ON a.businessentityid = edh.businessentityid
      WHERE edh.enddate IS NULL
      ORDER BY edh.businessentityid, edh.startdate DESC
    )
    SELECT s.shiftid::int                     AS "shiftId",
           s.name                             AS "name",
           to_char(s.starttime, 'HH24:MI')    AS "startTime",
           to_char(s.endtime, 'HH24:MI')      AS "endTime",
           (s.endtime <= s.starttime)         AS "crossesMidnight",
           count(av.businessentityid)::int    AS "employeeCount"
    FROM humanresources.shift s
    LEFT JOIN asignacion_vigente av ON av.shiftid = s.shiftid
    GROUP BY s.shiftid, s.name, s.starttime, s.endtime
    UNION ALL
    SELECT NULL, NULL, NULL, NULL, NULL, count(*)::int
    FROM activos a
    WHERE NOT EXISTS (
      SELECT 1 FROM asignacion_vigente av WHERE av.businessentityid = a.businessentityid
    )
    ORDER BY "employeeCount" DESC, "startTime" ASC
  `;

  return separarSinAsignacion(
    filas,
    (fila) => fila.shiftId === null,
    (fila) => ({
      shiftId: fila.shiftId!,
      name: fila.name!,
      startTime: fila.startTime!,
      endTime: fila.endTime!,
      crossesMidnight: fila.crossesMidnight!,
      employeeCount: fila.employeeCount,
    }),
  );
}
