import { prisma } from "@/data/prisma";
import type { ConteoAsignaciones } from "@/lib/referencias";
import type { ShiftInput } from "@/schemas/shift.schema";

/**
 * Acceso a `humanresources.shift`.
 *
 * Igual que `department`, es una tabla heredada de AdventureWorks: no se
 * altera su estructura y el único campo de auditoría disponible es
 * `modifiedDate`.
 *
 * Aquí se resuelve la conversión de horas, y es el único sitio del sistema
 * donde ocurre. Las columnas son `time`, que el driver entrega como `Date`
 * situando la hora en UTC: `15:00` vuelve como `1970-01-01T15:00:00.000Z`.
 * Leerla con `getHours()` daría las 10:00 en Bogotá y las 15:00 en el
 * servidor de producción —el mismo turno con dos horarios distintos según
 * dónde corra—. Por eso la lectura la hace PostgreSQL con `to_char`, que
 * devuelve el texto exacto de la columna, y la escritura fija la hora en UTC
 * explícitamente. De la capa de datos hacia arriba solo circula `HH:MM`.
 */

export type ShiftRow = {
  shiftId: number;
  name: string;
  /** `HH:MM` en 24 h. */
  startTime: string;
  /** `HH:MM` en 24 h. */
  endTime: string;
  modifiedDate: Date;
};

/**
 * Convierte `HH:MM` al `Date` que espera una columna `time`.
 *
 * La fecha es irrelevante —PostgreSQL descarta todo menos la hora—, pero el
 * huso no: se fija en UTC para que lo que se guarda sea la hora que el
 * usuario escribió, sin importar la zona del servidor.
 */
function aHoraDeBaseDeDatos(hora: string): Date {
  const [horas, minutos] = hora.split(":").map(Number);

  return new Date(Date.UTC(1970, 0, 1, horas, minutos, 0, 0));
}

/**
 * Construye el patrón de búsqueda. Escapa los comodines de LIKE para que un
 * usuario que busque "100%" no termine haciendo un match universal.
 */
function patronDeBusqueda(termino: string): string {
  const escapado = termino.replace(/([\\%_])/g, "\\$1");
  return `%${escapado}%`;
}

/** Búsqueda insensible a mayúsculas y a acentos, como en departamentos. */
export async function listShifts({
  q,
  skip,
  take,
}: {
  q: string;
  skip: number;
  take: number;
}): Promise<ShiftRow[]> {
  const patron = patronDeBusqueda(q);

  return prisma.$queryRaw<ShiftRow[]>`
    SELECT shiftid                        AS "shiftId",
           name                           AS "name",
           to_char(starttime, 'HH24:MI')  AS "startTime",
           to_char(endtime,   'HH24:MI')  AS "endTime",
           modifieddate                   AS "modifiedDate"
    FROM humanresources.shift
    WHERE unaccent(name) ILIKE unaccent(${patron})
    ORDER BY starttime ASC, name ASC
    LIMIT ${take} OFFSET ${skip}
  `;
}

export async function countShifts(q: string): Promise<number> {
  const patron = patronDeBusqueda(q);
  const filas = await prisma.$queryRaw<{ total: number }[]>`
    SELECT count(*)::int AS total
    FROM humanresources.shift
    WHERE unaccent(name) ILIKE unaccent(${patron})
  `;

  return filas[0]?.total ?? 0;
}

/** Detecta nombres repetidos ignorando mayúsculas y acentos. */
export async function findShiftIdByName(
  name: string,
  excluirId?: number,
): Promise<number | null> {
  const filas = await prisma.$queryRaw<{ shiftId: number }[]>`
    SELECT shiftid AS "shiftId"
    FROM humanresources.shift
    WHERE unaccent(lower(name)) = unaccent(lower(${name}))
      AND (${excluirId ?? null}::int IS NULL OR shiftid <> ${excluirId ?? null}::int)
    LIMIT 1
  `;

  return filas[0]?.shiftId ?? null;
}

export async function findShiftById(shiftId: number): Promise<ShiftRow | null> {
  const filas = await prisma.$queryRaw<ShiftRow[]>`
    SELECT shiftid                        AS "shiftId",
           name                           AS "name",
           to_char(starttime, 'HH24:MI')  AS "startTime",
           to_char(endtime,   'HH24:MI')  AS "endTime",
           modifieddate                   AS "modifiedDate"
    FROM humanresources.shift
    WHERE shiftid = ${shiftId}
    LIMIT 1
  `;

  return filas[0] ?? null;
}

/**
 * Relee la fila recién escrita.
 *
 * Devolver lo que dice la base —y no el objeto que se acaba de mandar— es lo
 * que hace que `startTime` y `endTime` salgan siempre por `to_char`, sin una
 * segunda ruta de conversión que pudiera discrepar de la lectura.
 */
async function releerTrasEscribir(shiftId: number): Promise<ShiftRow> {
  const fila = await findShiftById(shiftId);

  if (!fila) {
    throw new Error(`El turno ${shiftId} desapareció durante la escritura.`);
  }

  return fila;
}

export async function createShift({
  name,
  startTime,
  endTime,
}: ShiftInput): Promise<ShiftRow> {
  const creado = await prisma.shift.create({
    data: {
      name,
      startTime: aHoraDeBaseDeDatos(startTime),
      endTime: aHoraDeBaseDeDatos(endTime),
      modifiedDate: new Date(),
    },
    select: { shiftId: true },
  });

  return releerTrasEscribir(creado.shiftId);
}

export async function updateShift(
  shiftId: number,
  { name, startTime, endTime }: ShiftInput,
): Promise<ShiftRow> {
  await prisma.shift.update({
    where: { shiftId },
    data: {
      name,
      startTime: aHoraDeBaseDeDatos(startTime),
      endTime: aHoraDeBaseDeDatos(endTime),
      modifiedDate: new Date(),
    },
    select: { shiftId: true },
  });

  return releerTrasEscribir(shiftId);
}

export function deleteShift(shiftId: number) {
  return prisma.shift.delete({ where: { shiftId } });
}

/**
 * Cuenta asignaciones de empleados, históricas incluidas. Existe una foreign
 * key que ya impediría el borrado, pero consultarla antes permite devolver un
 * error de negocio comprensible en vez de una violación de constraint.
 */
export async function countShiftAssignments(
  shiftId: number,
): Promise<ConteoAsignaciones> {
  // `enddate IS NULL` es lo que distingue una asignación abierta de una
  // cerrada; se cuentan las dos en una sola pasada con FILTER.
  const filas = await prisma.$queryRaw<ConteoAsignaciones[]>`
    SELECT count(*) FILTER (WHERE enddate IS NULL)::int     AS "vigentes",
           count(*) FILTER (WHERE enddate IS NOT NULL)::int AS "historicas"
    FROM humanresources.employeedepartmenthistory
    WHERE shiftid = ${shiftId}
  `;

  return filas[0] ?? { vigentes: 0, historicas: 0 };
}
