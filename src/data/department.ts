import { prisma } from "@/data/prisma";
import type { DepartmentInput } from "@/schemas/department.schema";

/**
 * Acceso a `humanresources.department`.
 *
 * Ojo: es una tabla heredada de AdventureWorks, no propia de PeopleFlow. Se
 * escribe sobre ella porque el requisito de gestión de departamentos lo pide
 * explícitamente; su estructura no se altera. Por eso el único campo de
 * auditoría disponible es `modifiedDate`, el que ya traía el modelo original.
 */

export type DepartmentRow = {
  departmentId: number;
  name: string;
  groupName: string;
  modifiedDate: Date;
};

/**
 * Construye el patrón de búsqueda. Escapa los comodines de LIKE para que un
 * usuario que busque "100%" no termine haciendo un match universal.
 */
function patronDeBusqueda(termino: string): string {
  const escapado = termino.replace(/([\\%_])/g, "\\$1");
  return `%${escapado}%`;
}

/**
 * Búsqueda insensible a mayúsculas y a acentos.
 *
 * Prisma no sabe invocar `unaccent()` desde su constructor de consultas, así
 * que este es el único punto del módulo que baja a SQL. Con 16 departamentos
 * no hace falta índice funcional; si el volumen creciera, habría que envolver
 * `unaccent` en una función IMMUTABLE para poder indexarla.
 */
export async function listDepartments({
  q,
  skip,
  take,
}: {
  q: string;
  skip: number;
  take: number;
}): Promise<DepartmentRow[]> {
  const patron = patronDeBusqueda(q);

  return prisma.$queryRaw<DepartmentRow[]>`
    SELECT departmentid AS "departmentId",
           name         AS "name",
           groupname    AS "groupName",
           modifieddate AS "modifiedDate"
    FROM humanresources.department
    WHERE unaccent(name) ILIKE unaccent(${patron})
    ORDER BY name ASC
    LIMIT ${take} OFFSET ${skip}
  `;
}

export async function countDepartments(q: string): Promise<number> {
  const patron = patronDeBusqueda(q);
  const filas = await prisma.$queryRaw<{ total: number }[]>`
    SELECT count(*)::int AS total
    FROM humanresources.department
    WHERE unaccent(name) ILIKE unaccent(${patron})
  `;

  return filas[0]?.total ?? 0;
}

/** Detecta nombres repetidos ignorando mayúsculas y acentos. */
export async function findDepartmentIdByName(
  name: string,
  excluirId?: number,
): Promise<number | null> {
  const filas = await prisma.$queryRaw<{ departmentId: number }[]>`
    SELECT departmentid AS "departmentId"
    FROM humanresources.department
    WHERE unaccent(lower(name)) = unaccent(lower(${name}))
      AND (${excluirId ?? null}::int IS NULL OR departmentid <> ${excluirId ?? null}::int)
    LIMIT 1
  `;

  return filas[0]?.departmentId ?? null;
}

export function findDepartmentById(departmentId: number) {
  return prisma.department.findUnique({ where: { departmentId } });
}

export function createDepartment({ name, groupName }: DepartmentInput) {
  return prisma.department.create({
    data: { name, groupName, modifiedDate: new Date() },
  });
}

export function updateDepartment(
  departmentId: number,
  { name, groupName }: DepartmentInput,
) {
  return prisma.department.update({
    where: { departmentId },
    data: { name, groupName, modifiedDate: new Date() },
  });
}

export function deleteDepartment(departmentId: number) {
  return prisma.department.delete({ where: { departmentId } });
}

/**
 * Cuenta asignaciones de empleados, históricas incluidas. Existe una foreign
 * key que ya impediría el borrado, pero consultarla antes permite devolver un
 * error de negocio comprensible en vez de una violación de constraint.
 */
export function countDepartmentAssignments(departmentId: number) {
  return prisma.employeeDepartmentHistory.count({ where: { departmentId } });
}
