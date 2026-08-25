"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { CandidateWriteRow } from "@/features/candidatos/data/write";
import { fail, type Result } from "@/lib/result";
import { getSessionUser } from "@/lib/session";
import { candidateIdSchema, candidateInputSchema } from "@/features/candidatos/schemas";
import * as candidateService from "@/features/candidatos/services/write.service";

/**
 * Server Actions de candidatos.
 *
 * Se tratan con el mismo recelo que un endpoint público: aunque la UI oculte
 * los botones, cualquiera puede invocarlas, así que cada una comprueba sesión
 * y vuelve a validar la entrada aunque el formulario ya lo haya hecho.
 */

const RUTA = "/candidatos";
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

export async function createCandidateAction(
  input: unknown,
): Promise<Result<CandidateWriteRow>> {
  if (!(await getSessionUser())) {
    return fail("NO_AUTORIZADO", SIN_SESION);
  }

  const parsed = candidateInputSchema.safeParse(input);

  if (!parsed.success) {
    return fail("VALIDACION", DATOS_INVALIDOS, erroresPorCampo(parsed.error));
  }

  const resultado = await candidateService.createCandidate(parsed.data);

  if (resultado.success) {
    revalidatePath(RUTA);
  }

  return resultado;
}

export async function updateCandidateAction(
  id: unknown,
  input: unknown,
): Promise<Result<CandidateWriteRow>> {
  if (!(await getSessionUser())) {
    return fail("NO_AUTORIZADO", SIN_SESION);
  }

  const parsedId = candidateIdSchema.safeParse(id);

  if (!parsedId.success) {
    return fail("VALIDACION", "Identificador de candidato inválido.");
  }

  const parsed = candidateInputSchema.safeParse(input);

  if (!parsed.success) {
    return fail("VALIDACION", DATOS_INVALIDOS, erroresPorCampo(parsed.error));
  }

  const resultado = await candidateService.updateCandidate(parsedId.data, parsed.data);

  if (resultado.success) {
    revalidatePath(RUTA);
    revalidatePath(`${RUTA}/${parsedId.data}`);
  }

  return resultado;
}

export async function deleteCandidateAction(id: unknown): Promise<Result<null>> {
  if (!(await getSessionUser())) {
    return fail("NO_AUTORIZADO", SIN_SESION);
  }

  const parsedId = candidateIdSchema.safeParse(id);

  if (!parsedId.success) {
    return fail("VALIDACION", "Identificador de candidato inválido.");
  }

  const resultado = await candidateService.deleteCandidate(parsedId.data);

  if (resultado.success) {
    revalidatePath(RUTA);
  }

  return resultado;
}
