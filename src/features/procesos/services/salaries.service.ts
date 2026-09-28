import * as salaryData from "@/features/procesos/data/salaries";
import { TAMANO_PAGINA, type SalaryLogQuery } from "@/features/procesos/schemas";
import type { SalaryLogRow } from "@/features/procesos/types";
import { ok, unexpected, type Result } from "@/lib/result";

export type SalaryLogPage = {
  items: SalaryLogRow[];
  total: number;
  page: number;
  pageCount: number;
};

export async function getSalaryLogPage({
  page,
  ...filtro
}: SalaryLogQuery): Promise<Result<SalaryLogPage>> {
  try {
    const total = await salaryData.countSalaryLog(filtro);
    const pageCount = Math.max(1, Math.ceil(total / TAMANO_PAGINA));
    const paginaActual = Math.min(page, pageCount);
    const items = await salaryData.listSalaryLog({
      ...filtro,
      skip: (paginaActual - 1) * TAMANO_PAGINA,
      take: TAMANO_PAGINA,
    });

    return ok({ items, total, page: paginaActual, pageCount });
  } catch (error) {
    return unexpected("getSalaryLogPage", error);
  }
}
