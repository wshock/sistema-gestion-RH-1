import * as candidateData from "@/features/candidatos/data/read";
import type { CandidateDetail, CandidateListItem } from "@/features/candidatos/types";
import { fail, ok, unexpected, type Result } from "@/lib/result";
import { TAMANO_PAGINA, type CandidateQuery } from "@/features/candidatos/schemas";

/**
 * Reglas de negocio de la lectura de candidatos: paginación y traducción de
 * fallos a `Result`, igual que en el resto de los módulos de lectura.
 */

export type CandidateListPage = {
  items: CandidateListItem[];
  total: number;
  page: number;
  pageCount: number;
};

export async function getCandidatePage({
  page,
  estado,
}: CandidateQuery): Promise<Result<CandidateListPage>> {
  try {
    const total = await candidateData.countCandidates(estado);
    const pageCount = Math.max(1, Math.ceil(total / TAMANO_PAGINA));
    const paginaActual = Math.min(page, pageCount);

    const items = await candidateData.listCandidates({
      estado,
      skip: (paginaActual - 1) * TAMANO_PAGINA,
      take: TAMANO_PAGINA,
    });

    return ok({ items, total, page: paginaActual, pageCount });
  } catch (error) {
    return unexpected("getCandidatePage", error);
  }
}

export async function getCandidateDetail(
  jobCandidateId: number,
): Promise<Result<CandidateDetail>> {
  try {
    const candidato = await candidateData.findCandidateById(jobCandidateId);

    if (!candidato) {
      return fail("NO_ENCONTRADO", "El candidato solicitado no existe.");
    }

    return ok(candidato);
  } catch (error) {
    return unexpected("getCandidateDetail", error);
  }
}
