import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/data/prisma";
import type { EmployeeQuery } from "@/features/empleados/schemas";
import type {
  EmployeeAssignment,
  EmployeeListItem,
  EmployeePayRecord,
  PayFrequency,
} from "@/features/empleados/types";

/**
 * Acceso a la lectura de empleados.
 *
 * Une `person` (nombre), `employee` (datos laborales) y, por `LEFT JOIN`, la
 * fila de `employeedepartmenthistory` sin `enddate`: es la única que puede
 * llamarse la asignación vigente. El `LEFT JOIN` es deliberado: hoy los 290
 * empleados migrados tienen asignación abierta, pero nada impide que un alta
 * futura quede sin una, y esa fila no debe desaparecer del listado. Filtrar
 * por departamento o turno sobre las columnas de `edh` hereda esa misma
 * vigencia sin ninguna condición extra: si la asignación no está abierta,
 * `edh.departmentid`/`edh.shiftid` llegan `NULL` y no igualan a nada.
 *
 * `hireDate` se lee con `to_char` por la misma razón que en `department`/
 * `shift`: es una columna `date` y `getDate()` la correría un día según el
 * huso del servidor. Ver `docs/acuerdo-empleados.md`.
 */

export type EmployeeFilter = Omit<EmployeeQuery, "page">;

function patronDeBusqueda(termino: string): string {
  const escapado = termino.replace(/([\\%_])/g, "\\$1");
  return `%${escapado}%`;
}

/**
 * Arma el `WHERE` combinando búsqueda y filtros con AND. Cada filtro se
 * agrega solo si está presente, para no forzar comparaciones contra `NULL`
 * cuando el administrador no lo pidió.
 */
function condiciones({ q, departmentId, shiftId, estado }: EmployeeFilter): Prisma.Sql {
  const patron = patronDeBusqueda(q);

  const partes: Prisma.Sql[] = [
    Prisma.sql`(unaccent(p.firstname || ' ' || p.lastname) ILIKE unaccent(${patron})
      OR unaccent(e.nationalidnumber) ILIKE unaccent(${patron}))`,
  ];

  if (departmentId !== undefined) {
    partes.push(Prisma.sql`edh.departmentid = ${departmentId}`);
  }

  if (shiftId !== undefined) {
    partes.push(Prisma.sql`edh.shiftid = ${shiftId}`);
  }

  if (estado === "activos") {
    partes.push(Prisma.sql`e.currentflag = true`);
  } else if (estado === "inactivos") {
    partes.push(Prisma.sql`e.currentflag = false`);
  }

  return Prisma.join(partes, " AND ");
}

export async function listEmployees({
  skip,
  take,
  ...filtro
}: EmployeeFilter & { skip: number; take: number }): Promise<EmployeeListItem[]> {
  const where = condiciones(filtro);

  return prisma.$queryRaw<EmployeeListItem[]>`
    SELECT e.businessentityid                  AS "businessEntityId",
           p.firstname                         AS "firstName",
           p.lastname                          AS "lastName",
           e.nationalidnumber                  AS "nationalIdNumber",
           e.jobtitle                          AS "jobTitle",
           to_char(e.hiredate, 'YYYY-MM-DD')   AS "hireDate",
           e.currentflag                       AS "currentFlag",
           d.name                              AS "departmentName",
           s.name                              AS "shiftName"
    FROM humanresources.employee e
    JOIN person.person p ON p.businessentityid = e.businessentityid
    LEFT JOIN humanresources.employeedepartmenthistory edh
      ON edh.businessentityid = e.businessentityid AND edh.enddate IS NULL
    LEFT JOIN humanresources.department d ON d.departmentid = edh.departmentid
    LEFT JOIN humanresources.shift s ON s.shiftid = edh.shiftid
    WHERE ${where}
    ORDER BY p.lastname ASC, p.firstname ASC
    LIMIT ${take} OFFSET ${skip}
  `;
}

export async function countEmployees(filtro: EmployeeFilter): Promise<number> {
  const where = condiciones(filtro);

  const filas = await prisma.$queryRaw<{ total: number }[]>`
    SELECT count(*)::int AS total
    FROM humanresources.employee e
    JOIN person.person p ON p.businessentityid = e.businessentityid
    LEFT JOIN humanresources.employeedepartmenthistory edh
      ON edh.businessentityid = e.businessentityid AND edh.enddate IS NULL
    WHERE ${where}
  `;

  return filas[0]?.total ?? 0;
}

type EmployeeCoreRow = {
  businessEntityId: number;
  title: string | null;
  firstName: string;
  middleName: string | null;
  lastName: string;
  suffix: string | null;
  nationalIdNumber: string;
  loginId: string;
  jobTitle: string;
  birthDate: string;
  maritalStatus: string;
  gender: string;
  hireDate: string;
  salariedFlag: boolean;
  vacationHours: number;
  sickLeaveHours: number;
  currentFlag: boolean;
  modifiedDate: Date;
};

type AssignmentRow = {
  departmentId: number;
  departmentName: string;
  shiftId: number;
  shiftName: string;
  startDate: string;
  endDate: string | null;
};

type PayRow = {
  rateChangeDate: Date;
  rate: unknown;
  payFrequency: number;
};

function aNumero(valor: unknown): number {
  if (typeof valor === "number") {
    return valor;
  }

  return Number(valor);
}

/** Datos propios del empleado y de su persona. `null` si el id no existe. */
export async function findEmployeeById(
  businessEntityId: number,
): Promise<EmployeeCoreRow | null> {
  const filas = await prisma.$queryRaw<EmployeeCoreRow[]>`
    SELECT e.businessentityid                AS "businessEntityId",
           p.title                           AS "title",
           p.firstname                       AS "firstName",
           p.middlename                      AS "middleName",
           p.lastname                        AS "lastName",
           p.suffix                          AS "suffix",
           e.nationalidnumber                AS "nationalIdNumber",
           e.loginid                         AS "loginId",
           e.jobtitle                        AS "jobTitle",
           to_char(e.birthdate, 'YYYY-MM-DD') AS "birthDate",
           e.maritalstatus                   AS "maritalStatus",
           e.gender                          AS "gender",
           to_char(e.hiredate, 'YYYY-MM-DD') AS "hireDate",
           e.salariedflag                    AS "salariedFlag",
           e.vacationhours                   AS "vacationHours",
           e.sickleavehours                  AS "sickLeaveHours",
           e.currentflag                     AS "currentFlag",
           e.modifieddate                    AS "modifiedDate"
    FROM humanresources.employee e
    JOIN person.person p ON p.businessentityid = e.businessentityid
    WHERE e.businessentityid = ${businessEntityId}
    LIMIT 1
  `;

  return filas[0] ?? null;
}

export async function listAssignmentHistory(
  businessEntityId: number,
): Promise<EmployeeAssignment[]> {
  const filas = await prisma.$queryRaw<AssignmentRow[]>`
    SELECT edh.departmentid                        AS "departmentId",
           d.name                                  AS "departmentName",
           edh.shiftid                             AS "shiftId",
           s.name                                  AS "shiftName",
           to_char(edh.startdate, 'YYYY-MM-DD')    AS "startDate",
           to_char(edh.enddate, 'YYYY-MM-DD')      AS "endDate"
    FROM humanresources.employeedepartmenthistory edh
    JOIN humanresources.department d ON d.departmentid = edh.departmentid
    JOIN humanresources.shift s ON s.shiftid = edh.shiftid
    WHERE edh.businessentityid = ${businessEntityId}
    ORDER BY edh.startdate DESC, edh.departmentid DESC
  `;

  return filas;
}

export async function listPayHistory(
  businessEntityId: number,
): Promise<EmployeePayRecord[]> {
  const filas = await prisma.$queryRaw<PayRow[]>`
    SELECT eph.ratechangedate AS "rateChangeDate",
           eph.rate           AS "rate",
           eph.payfrequency   AS "payFrequency"
    FROM humanresources.employeepayhistory eph
    WHERE eph.businessentityid = ${businessEntityId}
    ORDER BY eph.ratechangedate DESC
  `;

  return filas.map((fila) => ({
    rateChangeDate: fila.rateChangeDate,
    rate: aNumero(fila.rate),
    payFrequency: aFrecuencia(fila.payFrequency),
  }));
}

function aFrecuencia(valor: number): PayFrequency {
  if (valor === 1 || valor === 2) {
    return valor;
  }

  throw new Error(`payFrequency inesperado: ${valor}`);
}
