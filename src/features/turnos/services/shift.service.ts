import * as shiftData from "@/features/turnos/data/shift";
import type { ShiftRow } from "@/features/turnos/data/shift";
import { mensajeDeBloqueo, totalAsignaciones } from "@/lib/referencias";
import { fail, ok, unexpected, type Result } from "@/lib/result";
import {
  TAMANO_PAGINA,
  type ShiftInput,
  type ShiftQuery,
} from "@/features/turnos/schemas";

/**
 * Reglas de negocio de turnos.
 *
 * Mismo patrón que departamentos: decide qué cuenta como nombre repetido,
 * cuándo se puede borrar y cómo se ajusta una página fuera de rango, y
 * traduce cualquier fallo a un `Result` para que la acción de arriba nunca
 * vea una excepción de Prisma.
 *
 * La coherencia del horario no se comprueba acá sino en el esquema de Zod,
 * porque es la misma regla que necesita el formulario para avisar antes de
 * enviar (ver `shift.schema.ts`).
 */

export type ShiftListPage = {
  items: ShiftRow[];
  total: number;
  page: number;
  pageCount: number;
};

export async function getShiftPage({
  q,
  page,
}: ShiftQuery): Promise<Result<ShiftListPage>> {
  try {
    const total = await shiftData.countShifts(q);
    const pageCount = Math.max(1, Math.ceil(total / TAMANO_PAGINA));
    // Si se borra el último registro de la última página, o alguien escribe
    // ?page=99 a mano, mostramos la última página real en vez de una vacía.
    const paginaActual = Math.min(page, pageCount);

    const items = await shiftData.listShifts({
      q,
      skip: (paginaActual - 1) * TAMANO_PAGINA,
      take: TAMANO_PAGINA,
    });

    return ok({ items, total, page: paginaActual, pageCount });
  } catch (error) {
    return unexpected("getShiftPage", error);
  }
}

export async function createShift(input: ShiftInput): Promise<Result<ShiftRow>> {
  try {
    const repetido = await shiftData.findShiftIdByName(input.name);

    if (repetido !== null) {
      return fail("DUPLICADO", `Ya existe un turno llamado "${input.name}".`, {
        name: ["Ese nombre ya está en uso."],
      });
    }

    return ok(await shiftData.createShift(input));
  } catch (error) {
    return unexpected("createShift", error);
  }
}

export async function updateShift(
  shiftId: number,
  input: ShiftInput,
): Promise<Result<ShiftRow>> {
  try {
    const actual = await shiftData.findShiftById(shiftId);

    if (!actual) {
      return fail("NO_ENCONTRADO", "El turno que intentás editar ya no existe.");
    }

    const repetido = await shiftData.findShiftIdByName(input.name, shiftId);

    if (repetido !== null) {
      return fail("DUPLICADO", `Ya existe un turno llamado "${input.name}".`, {
        name: ["Ese nombre ya está en uso."],
      });
    }

    return ok(await shiftData.updateShift(shiftId, input));
  } catch (error) {
    return unexpected("updateShift", error);
  }
}

export async function deleteShift(shiftId: number): Promise<Result<null>> {
  try {
    const actual = await shiftData.findShiftById(shiftId);

    if (!actual) {
      return fail("NO_ENCONTRADO", "El turno que intentás eliminar ya no existe.");
    }

    // La comprobación va antes del borrado, no se deduce de un fallo de la
    // base: solo así se puede explicar el motivo en términos de negocio en
    // lugar de traducir una violación de clave foránea.
    const asignaciones = await shiftData.countShiftAssignments(shiftId);

    if (totalAsignaciones(asignaciones) > 0) {
      return fail("CONFLICTO", mensajeDeBloqueo("turno", actual.name, asignaciones));
    }

    await shiftData.deleteShift(shiftId);

    return ok(null);
  } catch (error) {
    return unexpected("deleteShift", error);
  }
}
