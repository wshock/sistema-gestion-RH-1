import * as candidateData from "@/features/candidatos/data/read";
import type { CandidateDetail } from "@/features/candidatos/types";
import { fail, ok, unexpected, type Result } from "@/lib/result";

/**
 * Lectura del candidato para la pantalla de contratación (HU-29).
 *
 * Reutiliza `findCandidateById`: la pantalla necesita exactamente los mismos
 * datos que la ficha de lectura (nombre, estado, currículum) para mostrarlos
 * como referencia no editable. La diferencia es que acá el estado además
 * decide si se puede entrar: un candidato ya contratado no inicia el proceso
 * de nuevo.
 */
export async function getCandidateForHire(
  jobCandidateId: number,
): Promise<Result<CandidateDetail>> {
  try {
    const candidato = await candidateData.findCandidateById(jobCandidateId);

    if (!candidato) {
      return fail("NO_ENCONTRADO", "El candidato solicitado no existe.");
    }

    if (candidato.status === "contratado") {
      return fail(
        "CONFLICTO",
        "Este candidato ya fue contratado: no se puede iniciar el proceso de nuevo.",
      );
    }

    return ok(candidato);
  } catch (error) {
    return unexpected("getCandidateForHire", error);
  }
}
