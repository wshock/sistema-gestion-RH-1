"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { HireResult } from "@/features/candidatos/data/hire";
import { fail, type Result } from "@/lib/result";
import { getSessionUser } from "@/lib/session";
import { candidateIdSchema, hireCandidateSchema } from "@/features/candidatos/schemas";
import * as hireService from "@/features/candidatos/services/hire.service";

/**
 * Ejecución de la contratación (HU-30).
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
): Promise<Result<HireResult>> {
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

  const resultado = await hireService.hireCandidate(parsedId.data, parsed.data);

  if (resultado.success) {
    // El candidato deja de listarse como pendiente y el empleado nuevo
    // aparece en su propio listado y ficha.
    revalidatePath("/candidatos");
    revalidatePath(`/candidatos/${parsedId.data}`);
    revalidatePath("/empleados");
    revalidatePath(`/empleados/${resultado.data.businessEntityId}`);
  }

  return resultado;
}
