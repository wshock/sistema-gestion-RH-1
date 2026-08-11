"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ShiftRow } from "@/data/shift";
import { fail, type Result } from "@/lib/result";
import { getSessionUser } from "@/lib/session";
import { shiftIdSchema, shiftInputSchema } from "@/schemas/shift.schema";
import * as shiftService from "@/services/shift.service";

/**
 * Server Actions de turnos.
 *
 * Se tratan con el mismo recelo que un endpoint público: aunque la UI oculte
 * los botones, cualquiera puede invocarlas, así que cada una comprueba sesión
 * y vuelve a validar la entrada aunque el formulario ya lo haya hecho.
 */

const RUTA = "/turnos";
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

export async function createShiftAction(input: unknown): Promise<Result<ShiftRow>> {
  if (!(await getSessionUser())) {
    return fail("NO_AUTORIZADO", SIN_SESION);
  }

  const parsed = shiftInputSchema.safeParse(input);

  if (!parsed.success) {
    return fail("VALIDACION", DATOS_INVALIDOS, erroresPorCampo(parsed.error));
  }

  const resultado = await shiftService.createShift(parsed.data);

  if (resultado.success) {
    revalidatePath(RUTA);
  }

  return resultado;
}

export async function updateShiftAction(
  id: unknown,
  input: unknown,
): Promise<Result<ShiftRow>> {
  if (!(await getSessionUser())) {
    return fail("NO_AUTORIZADO", SIN_SESION);
  }

  const parsedId = shiftIdSchema.safeParse(id);
  const parsed = shiftInputSchema.safeParse(input);

  if (!parsedId.success) {
    return fail("VALIDACION", "Identificador de turno inválido.");
  }

  if (!parsed.success) {
    return fail("VALIDACION", DATOS_INVALIDOS, erroresPorCampo(parsed.error));
  }

  const resultado = await shiftService.updateShift(parsedId.data, parsed.data);

  if (resultado.success) {
    revalidatePath(RUTA);
  }

  return resultado;
}

export async function deleteShiftAction(id: unknown): Promise<Result<null>> {
  if (!(await getSessionUser())) {
    return fail("NO_AUTORIZADO", SIN_SESION);
  }

  const parsedId = shiftIdSchema.safeParse(id);

  if (!parsedId.success) {
    return fail("VALIDACION", "Identificador de turno inválido.");
  }

  const resultado = await shiftService.deleteShift(parsedId.data);

  if (resultado.success) {
    revalidatePath(RUTA);
  }

  return resultado;
}
