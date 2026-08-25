import { cache } from "react";

import * as employeeData from "@/features/empleados/data/read";
import type {
  EmployeeDetail,
  EmployeeListItem,
  Gender,
  MaritalStatus,
} from "@/features/empleados/types";
import { fail, ok, unexpected, type Result } from "@/lib/result";
import { TAMANO_PAGINA, type EmployeeQuery } from "@/features/empleados/schemas";
import { currentAssignment, currentPay } from "@/features/empleados/vigencia";

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
  page,
  ...filtro
}: EmployeeQuery): Promise<Result<EmployeeListPage>> {
  try {
    const total = await employeeData.countEmployees(filtro);
    const pageCount = Math.max(1, Math.ceil(total / TAMANO_PAGINA));
    const paginaActual = Math.min(page, pageCount);

    const items = await employeeData.listEmployees({
      ...filtro,
      skip: (paginaActual - 1) * TAMANO_PAGINA,
      take: TAMANO_PAGINA,
    });

    return ok({ items, total, page: paginaActual, pageCount });
  } catch (error) {
    return unexpected("getEmployeePage", error);
  }
}

/**
 * Ficha de un empleado: datos propios, historiales y situación vigente.
 *
 * Va envuelta en `cache` para que la página y `generateMetadata` no disparen
 * la misma consulta dos veces en un mismo render.
 */
export const getEmployeeDetail = cache(
  async (businessEntityId: number): Promise<Result<EmployeeDetail>> => {
    try {
      const empleado = await employeeData.findEmployeeById(businessEntityId);

      if (!empleado) {
        return fail("NO_ENCONTRADO", "El empleado solicitado no existe.");
      }

      const [assignmentHistory, payHistory] = await Promise.all([
        loadAssignmentHistory(businessEntityId),
        loadPayHistory(businessEntityId),
      ]);

      return ok({
        ...empleado,
        maritalStatus: comoEstadoCivil(empleado.maritalStatus),
        gender: comoGenero(empleado.gender),
        currentAssignment: currentAssignment(assignmentHistory),
        currentPay: currentPay(payHistory),
        assignmentHistory,
        payHistory,
      });
    } catch (error) {
      return unexpected("getEmployeeDetail", error);
    }
  },
);

/** Historial de asignaciones, más reciente primero. */
async function loadAssignmentHistory(businessEntityId: number) {
  const filas = await employeeData.listAssignmentHistory(businessEntityId);

  return [...filas].sort((a, b) =>
    a.startDate === b.startDate
      ? b.departmentId - a.departmentId
      : a.startDate < b.startDate
        ? 1
        : -1,
  );
}

/** Historial salarial, fecha de cambio más reciente primero. */
async function loadPayHistory(businessEntityId: number) {
  const filas = await employeeData.listPayHistory(businessEntityId);

  return [...filas].sort(
    (a, b) => b.rateChangeDate.getTime() - a.rateChangeDate.getTime(),
  );
}

function comoEstadoCivil(valor: string): MaritalStatus {
  if (valor === "S" || valor === "M") {
    return valor;
  }

  throw new Error(`maritalStatus inesperado: ${valor}`);
}

function comoGenero(valor: string): Gender {
  if (valor === "M" || valor === "F") {
    return valor;
  }

  throw new Error(`gender inesperado: ${valor}`);
}
