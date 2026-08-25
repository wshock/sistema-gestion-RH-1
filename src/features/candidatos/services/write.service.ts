import * as candidateWriteData from "@/features/candidatos/data/write";
import type { CandidateWriteRow } from "@/features/candidatos/data/write";
import { fail, ok, unexpected, type Result } from "@/lib/result";
import type { CandidateInput } from "@/features/candidatos/schemas";

/**
 * Reglas de negocio del alta y edición de candidatos.
 *
 * La única regla propia del módulo vive acá: un candidato contratado no se
 * edita, porque alteraría la información sobre la que ya se decidió una
 * contratación. Se comprueba antes de escribir, no se deduce de un fallo de
 * la base, para poder explicarlo en términos de negocio.
 */

export async function createCandidate(
  input: CandidateInput,
): Promise<Result<CandidateWriteRow>> {
  try {
    return ok(await candidateWriteData.createCandidate(input));
  } catch (error) {
    return unexpected("createCandidate", error);
  }
}

export async function updateCandidate(
  jobCandidateId: number,
  input: CandidateInput,
): Promise<Result<CandidateWriteRow>> {
  try {
    const actual = await candidateWriteData.findCandidateForWrite(jobCandidateId);

    if (!actual) {
      return fail("NO_ENCONTRADO", "El candidato que intentás editar ya no existe.");
    }

    if (actual.businessEntityId !== null) {
      return fail(
        "CONFLICTO",
        "Este candidato ya fue contratado: su información no se puede editar.",
      );
    }

    return ok(await candidateWriteData.updateCandidate(jobCandidateId, input));
  } catch (error) {
    return unexpected("updateCandidate", error);
  }
}
