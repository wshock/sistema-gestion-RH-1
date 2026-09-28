"use server";

import { getAverageSalaryByDepartment } from "@/features/reportes/services/compensation.service";
import type { AverageSalaryByDepartmentRow } from "@/features/reportes/types";
import { fail, type Result } from "@/lib/result";
import { getSessionUser } from "@/lib/session";

/**
 * Lectura del reporte de salario promedio por departamento.
 *
 * Aunque la página también exige sesión, la acción se trata como un endpoint
 * público: cualquiera puede invocarla, así que vuelve a comprobar sesión
 * antes de tocar el servicio.
 */

const SIN_SESION = "Tu sesión expiró. Iniciá sesión de nuevo para continuar.";

export async function getAverageSalaryByDepartmentAction(): Promise<
  Result<AverageSalaryByDepartmentRow[]>
> {
  if (!(await getSessionUser())) {
    return fail("NO_AUTORIZADO", SIN_SESION);
  }

  return getAverageSalaryByDepartment();
}
