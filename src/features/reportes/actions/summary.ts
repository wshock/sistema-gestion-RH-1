"use server";

import { getReportTotals } from "@/features/reportes/services/summary.service";
import type { ReportTotals } from "@/features/reportes/types";
import { fail, type Result } from "@/lib/result";
import { getSessionUser } from "@/lib/session";

const SIN_SESION = "Tu sesión expiró. Iniciá sesión de nuevo para continuar.";

export async function getReportTotalsAction(): Promise<Result<ReportTotals>> {
  if (!(await getSessionUser())) {
    return fail("NO_AUTORIZADO", SIN_SESION);
  }

  return getReportTotals();
}
