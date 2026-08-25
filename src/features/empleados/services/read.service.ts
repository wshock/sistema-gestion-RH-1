import * as employeeData from "@/features/empleados/data/read";
import type { EmployeeListItem } from "@/features/empleados/types";
import { ok, unexpected, type Result } from "@/lib/result";
import { TAMANO_PAGINA, type EmployeeQuery } from "@/features/empleados/schemas";

/**
 * Reglas de negocio de la lectura de empleados.
 *
 * Traduce página y búsqueda a `skip`/`take`, ajusta una página fuera de rango
 * a la última real y envuelve cualquier fallo en un `Result`, igual que
 * `department.service.ts`.
 */

export type EmployeeListPage = {
  items: EmployeeListItem[];
  total: number;
  page: number;
  pageCount: number;
};

export async function getEmployeePage({
  q,
  page,
}: EmployeeQuery): Promise<Result<EmployeeListPage>> {
  try {
    const total = await employeeData.countEmployees(q);
    const pageCount = Math.max(1, Math.ceil(total / TAMANO_PAGINA));
    const paginaActual = Math.min(page, pageCount);

    const items = await employeeData.listEmployees({
      q,
      skip: (paginaActual - 1) * TAMANO_PAGINA,
      take: TAMANO_PAGINA,
    });

    return ok({ items, total, page: paginaActual, pageCount });
  } catch (error) {
    return unexpected("getEmployeePage", error);
  }
}
