import * as candidatesData from "@/features/reportes/data/candidates";
import type { CandidateStatusReport } from "@/features/reportes/types";
import { ok, unexpected, type Result } from "@/lib/result";

/**
 * Reglas de negocio del reporte de estado de candidatos.
 *
 * La tasa de conversión es contratados / total. Se calcula acá —no en SQL—
 * para redondear de forma explícita y devolver `null` cuando no hay base.
 */

function tasaDeConversion(hired: number, total: number): number | null {
  if (total === 0) {
    return null;
  }

  return Math.round((hired / total) * 1000) / 10;
}

export async function getCandidateStatusReport(): Promise<
  Result<CandidateStatusReport>
> {
  try {
    const conteos = await candidatesData.countCandidatesByStatus();

    return ok({
      ...conteos,
      conversionRate: tasaDeConversion(conteos.hired, conteos.total),
    });
  } catch (error) {
    return unexpected("getCandidateStatusReport", error);
  }
}
