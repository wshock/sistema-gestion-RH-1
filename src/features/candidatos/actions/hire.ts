"use server";

import { z } from "zod";

import { fail, type Result } from "@/lib/result";
import { getSessionUser } from "@/lib/session";
import { candidateIdSchema, hireCandidateSchema } from "@/features/candidatos/schemas";

/**
 * Ejecución de la contratación.
 *
 * ⚠️ Marcador de posición. HU-29 construye la pantalla y su validación; HU-30
 * implementa la escritura transaccional (persona, empleado, asignación y
 * salario iniciales, y el vínculo `JobCandidate.businessEntityId`). La
 * validación de acá ya es la definitiva —mismo esquema que usa el
 * formulario—, así que HU-30 solo tiene que reemplazar el `fail` final por la
 * llamada al servicio real.
 *
 * Se trata como un endpoint público: comprueba sesión y vuelve a validar la
 * entrada aunque el formulario ya lo haya hecho.
 */

const SIN_SESION = "Tu sesión expiró. Iniciá sesión de nuevo para continuar.";
const DATOS_INVALIDOS = "Revisá los datos del formulario.";

function erroresPorCampo<T>(error: z.ZodError<T>): Record<string, string[]> {
  const fieldErrors: Record<string, string[] | undefined> =
    z.flattenError(error).fieldErrors;

  return Object.fromEntries(
    Object.entries(fieldErrors).filter((entrada): entrada is [string, string[]] =>
      Boolean(entrada[1]?.length),
    ),
  );
}

export async function hireCandidateAction(
  jobCandidateId: unknown,
  input: unknown,
): Promise<Result<never>> {
  if (!(await getSessionUser())) {
    return fail("NO_AUTORIZADO", SIN_SESION);
  }

  const parsedId = candidateIdSchema.safeParse(jobCandidateId);

  if (!parsedId.success) {
    return fail("VALIDACION", "Identificador de candidato inválido.");
  }

  const parsed = hireCandidateSchema.safeParse(input);

  if (!parsed.success) {
    return fail("VALIDACION", DATOS_INVALIDOS, erroresPorCampo(parsed.error));
  }

  return fail(
    "INESPERADO",
    "El proceso de contratación se habilita en la próxima entrega.",
  );
}
