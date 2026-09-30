"use server";

import { getCandidateStatusReport } from "@/features/reportes/services/candidates.service";
import type { CandidateStatusReport } from "@/features/reportes/types";
import { fail, type Result } from "@/lib/result";
import { getSessionUser } from "@/lib/session";

/**
 * Lectura del reporte de estado de candidatos.
 *
 * Aunque la página también exige sesión, la acción se trata como un endpoint
 * público: cualquiera puede invocarla, así que vuelve a comprobar sesión
 * antes de tocar el servicio.
 */

const SIN_SESION = "Tu sesión expiró. Iniciá sesión de nuevo para continuar.";

export async function getCandidateStatusReportAction(): Promise<
  Result<CandidateStatusReport>
> {
  if (!(await getSessionUser())) {
    return fail("NO_AUTORIZADO", SIN_SESION);
  }

  return getCandidateStatusReport();
}
