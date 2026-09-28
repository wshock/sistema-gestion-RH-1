import * as compensationData from "@/features/reportes/data/compensation";
import type { AverageSalaryByDepartmentRow } from "@/features/reportes/types";
import { ok, unexpected, type Result } from "@/lib/result";

/**
 * Reglas de negocio del reporte de compensación.
 *
 * Hoy solo envuelve la consulta en `Result`: la agregación vive en SQL. Si
 * más adelante el reporte admite filtros (grupo organizativo, solo áreas con
 * gente), se validan y traducen acá.
 */

export async function getAverageSalaryByDepartment(): Promise<
  Result<AverageSalaryByDepartmentRow[]>
> {
  try {
    return ok(await compensationData.listAverageSalaryByDepartment());
  } catch (error) {
    return unexpected("getAverageSalaryByDepartment", error);
  }
}
