import { prisma } from "@/data/prisma";
import type { EmployeeListItem } from "@/features/empleados/types";

/**
 * Acceso a la lectura de empleados.
 *
 * Une `person` (nombre), `employee` (datos laborales) y, por `LEFT JOIN`, la
 * fila de `employeedepartmenthistory` sin `enddate`: es la única que puede
 * llamarse la asignación vigente. El `LEFT JOIN` es deliberado: hoy los 290
 * empleados migrados tienen asignación abierta, pero nada impide que un alta
 * futura quede sin una, y esa fila no debe desaparecer del listado.
 *
 * `hireDate` se lee con `to_char` por la misma razón que en `department`/
 * `shift`: es una columna `date` y `getDate()` la correría un día según el
 * huso del servidor. Ver `docs/acuerdo-empleados.md`.
 */

function patronDeBusqueda(termino: string): string {
  const escapado = termino.replace(/([\\%_])/g, "\\$1");
  return `%${escapado}%`;
}

export async function listEmployees({
  q,
  skip,
  take,
}: {
  q: string;
  skip: number;
  take: number;
}): Promise<EmployeeListItem[]> {
  const patron = patronDeBusqueda(q);

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
    WHERE unaccent(p.firstname || ' ' || p.lastname) ILIKE unaccent(${patron})
       OR unaccent(e.nationalidnumber) ILIKE unaccent(${patron})
    ORDER BY p.lastname ASC, p.firstname ASC
    LIMIT ${take} OFFSET ${skip}
  `;
}

export async function countEmployees(q: string): Promise<number> {
  const patron = patronDeBusqueda(q);
  const filas = await prisma.$queryRaw<{ total: number }[]>`
    SELECT count(*)::int AS total
    FROM humanresources.employee e
    JOIN person.person p ON p.businessentityid = e.businessentityid
    WHERE unaccent(p.firstname || ' ' || p.lastname) ILIKE unaccent(${patron})
       OR unaccent(e.nationalidnumber) ILIKE unaccent(${patron})
  `;

  return filas[0]?.total ?? 0;
}
