"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { EmployeeWriteRow } from "@/features/empleados/data/write";
import { fail, type Result } from "@/lib/result";
import { getSessionUser } from "@/lib/session";
import { employeeCreateSchema } from "@/features/empleados/schemas";
import * as employeeService from "@/features/empleados/services/write.service";

/**
 * Server Actions de escritura de empleados.
 *
 * Se tratan como un endpoint público: cada una comprueba sesión y vuelve a
 * validar la entrada aunque el formulario ya lo haya hecho.
 */

const RUTA = "/empleados";
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

export async function createEmployeeAction(
  input: unknown,
): Promise<Result<EmployeeWriteRow>> {
  if (!(await getSessionUser())) {
    return fail("NO_AUTORIZADO", SIN_SESION);
  }

  const parsed = employeeCreateSchema.safeParse(input);

  if (!parsed.success) {
    return fail("VALIDACION", DATOS_INVALIDOS, erroresPorCampo(parsed.error));
  }

  const resultado = await employeeService.createEmployee(parsed.data);

  if (resultado.success) {
    revalidatePath(RUTA);
    revalidatePath(`${RUTA}/${resultado.data.businessEntityId}`);
  }

  return resultado;
}
