"use server";

import type { EmployeeDetail } from "@/features/empleados/types";
import { fail, type Result } from "@/lib/result";
import { getSessionUser } from "@/lib/session";
import { employeeIdSchema } from "@/features/empleados/schemas";
import { getEmployeeDetail } from "@/features/empleados/services/read.service";

/**
 * Lectura de la ficha de un empleado.
 *
 * Aunque la página también exige sesión, la acción se trata como un endpoint
 * público: cualquiera puede invocarla, así que vuelve a comprobar sesión y a
 * validar el identificador antes de tocar el servicio.
 */

const SIN_SESION = "Tu sesión expiró. Iniciá sesión de nuevo para continuar.";

export async function getEmployeeDetailAction(
  input: unknown,
): Promise<Result<EmployeeDetail>> {
  if (!(await getSessionUser())) {
    return fail("NO_AUTORIZADO", SIN_SESION);
  }

  const parsed = employeeIdSchema.safeParse(input);

  if (!parsed.success) {
    return fail("VALIDACION", "El identificador del empleado no es válido.");
  }

  return getEmployeeDetail(parsed.data);
}
