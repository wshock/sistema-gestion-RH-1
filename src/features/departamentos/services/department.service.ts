import * as departmentData from "@/features/departamentos/data/department";
import type { DepartmentRow } from "@/features/departamentos/data/department";
import { mensajeDeBloqueo, totalAsignaciones } from "@/lib/referencias";
import { fail, ok, unexpected, type Result } from "@/lib/result";
import {
  TAMANO_PAGINA,
  type DepartmentInput,
  type DepartmentQuery,
} from "@/features/departamentos/schemas";

/**
 * Reglas de negocio de departamentos.
 *
 * Esta capa existe porque hay decisiones que no son ni presentación ni
 * consulta: qué cuenta como nombre repetido, cuándo se puede borrar y cómo se
 * ajusta una página fuera de rango. Traduce además cualquier fallo a un
 * `Result`, de modo que la acción de arriba nunca vea una excepción de Prisma.
 */

export type DepartmentListPage = {
  items: DepartmentRow[];
  total: number;
  page: number;
  pageCount: number;
};

export async function getDepartmentPage({
  q,
  page,
}: DepartmentQuery): Promise<Result<DepartmentListPage>> {
  try {
    const total = await departmentData.countDepartments(q);
    const pageCount = Math.max(1, Math.ceil(total / TAMANO_PAGINA));
    // Si se borra el último registro de la última página, o alguien escribe
    // ?page=99 a mano, mostramos la última página real en vez de una vacía.
    const paginaActual = Math.min(page, pageCount);

    const items = await departmentData.listDepartments({
      q,
      skip: (paginaActual - 1) * TAMANO_PAGINA,
      take: TAMANO_PAGINA,
    });

    return ok({ items, total, page: paginaActual, pageCount });
  } catch (error) {
    return unexpected("getDepartmentPage", error);
  }
}

export async function createDepartment(
  input: DepartmentInput,
): Promise<Result<DepartmentRow>> {
  try {
    const repetido = await departmentData.findDepartmentIdByName(input.name);

    if (repetido !== null) {
      return fail("DUPLICADO", `Ya existe un departamento llamado "${input.name}".`, {
        name: ["Ese nombre ya está en uso."],
      });
    }

    return ok(await departmentData.createDepartment(input));
  } catch (error) {
    return unexpected("createDepartment", error);
  }
}

export async function updateDepartment(
  departmentId: number,
  input: DepartmentInput,
): Promise<Result<DepartmentRow>> {
  try {
    const actual = await departmentData.findDepartmentById(departmentId);

    if (!actual) {
      return fail("NO_ENCONTRADO", "El departamento que intentás editar ya no existe.");
    }

    const repetido = await departmentData.findDepartmentIdByName(
      input.name,
      departmentId,
    );

    if (repetido !== null) {
      return fail("DUPLICADO", `Ya existe un departamento llamado "${input.name}".`, {
        name: ["Ese nombre ya está en uso."],
      });
    }

    return ok(await departmentData.updateDepartment(departmentId, input));
  } catch (error) {
    return unexpected("updateDepartment", error);
  }
}

export async function deleteDepartment(departmentId: number): Promise<Result<null>> {
  try {
    const actual = await departmentData.findDepartmentById(departmentId);

    if (!actual) {
      return fail("NO_ENCONTRADO", "El departamento que intentás eliminar ya no existe.");
    }

    // La comprobación va antes del borrado, no se deduce de un fallo de la
    // base: solo así se puede explicar el motivo en términos de negocio en
    // lugar de traducir una violación de clave foránea.
    const asignaciones = await departmentData.countDepartmentAssignments(departmentId);

    if (totalAsignaciones(asignaciones) > 0) {
      return fail(
        "CONFLICTO",
        mensajeDeBloqueo("departamento", actual.name, asignaciones),
      );
    }

    await departmentData.deleteDepartment(departmentId);

    return ok(null);
  } catch (error) {
    return unexpected("deleteDepartment", error);
  }
}
