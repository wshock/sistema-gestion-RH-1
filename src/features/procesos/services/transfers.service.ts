import * as transferData from "@/features/procesos/data/transfers";
import { TAMANO_PAGINA, type TransferLogQuery } from "@/features/procesos/schemas";
import type { TransferLogRow } from "@/features/procesos/types";
import { unexpected, ok, type Result } from "@/lib/result";

export type TransferLogPage = {
  items: TransferLogRow[];
  total: number;
  page: number;
  pageCount: number;
};

export async function getTransferLogPage({
  page,
  ...filtro
}: TransferLogQuery): Promise<Result<TransferLogPage>> {
  try {
    const total = await transferData.countTransferLog(filtro);
    const pageCount = Math.max(1, Math.ceil(total / TAMANO_PAGINA));
    const paginaActual = Math.min(page, pageCount);
    const items = await transferData.listTransferLog({
      ...filtro,
      skip: (paginaActual - 1) * TAMANO_PAGINA,
      take: TAMANO_PAGINA,
    });

    return ok({ items, total, page: paginaActual, pageCount });
  } catch (error) {
    return unexpected("getTransferLogPage", error);
  }
}
