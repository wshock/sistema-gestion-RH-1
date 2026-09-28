import * as seniorityData from "@/features/reportes/data/seniority";
import {
  TAMANO_PAGINA_ANTIGUEDAD,
  type SeniorityQuery,
} from "@/features/reportes/schemas";
import type {
  SeniorityBracketRow,
  SeniorityEmployeeRow,
} from "@/features/reportes/types";
import { ok, unexpected, type Result } from "@/lib/result";

/**
 * Reglas de negocio del reporte de antigüedad.
 *
 * Traduce la página pedida a `skip`/`take`, ajusta una página fuera de rango
 * y combina el resumen por tramos con el detalle paginado en un solo
 * `Result`.
 */

export type SeniorityReport = {
  brackets: SeniorityBracketRow[];
  items: SeniorityEmployeeRow[];
  total: number;
  page: number;
  pageCount: number;
};

export async function getSeniorityReport({
  page,
}: SeniorityQuery): Promise<Result<SeniorityReport>> {
  try {
    const [total, brackets] = await Promise.all([
      seniorityData.countActiveEmployees(),
      seniorityData.listSeniorityBrackets(),
    ]);

    const pageCount = Math.max(1, Math.ceil(total / TAMANO_PAGINA_ANTIGUEDAD));
    const paginaActual = Math.min(page, pageCount);

    const items = await seniorityData.listSeniorityEmployees({
      skip: (paginaActual - 1) * TAMANO_PAGINA_ANTIGUEDAD,
      take: TAMANO_PAGINA_ANTIGUEDAD,
    });

    return ok({
      brackets,
      items,
      total,
      page: paginaActual,
      pageCount,
    });
  } catch (error) {
    return unexpected("getSeniorityReport", error);
  }
}
