"use server";

import { seniorityQuerySchema } from "@/features/reportes/schemas";
import {
  getSeniorityReport,
  type SeniorityReport,
} from "@/features/reportes/services/seniority.service";
import { fail, type Result } from "@/lib/result";
import { getSessionUser } from "@/lib/session";

/**
 * Lectura del reporte de antigüedad del personal.
 *
 * Aunque la página también exige sesión, la acción se trata como un endpoint
 * público: cualquiera puede invocarla, así que vuelve a comprobar sesión y a
 * validar la página antes de tocar el servicio.
 */

const SIN_SESION = "Tu sesión expiró. Iniciá sesión de nuevo para continuar.";

export async function getSeniorityReportAction(
  input: unknown,
): Promise<Result<SeniorityReport>> {
  if (!(await getSessionUser())) {
    return fail("NO_AUTORIZADO", SIN_SESION);
  }

  const parsed = seniorityQuerySchema.safeParse(input);

  if (!parsed.success) {
    return fail("VALIDACION", "Los parámetros del reporte no son válidos.");
  }

  return getSeniorityReport(parsed.data);
}
