"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { DepartmentRow } from "@/data/department";
import { fail, type Result } from "@/lib/result";
import { getSessionUser } from "@/lib/session";
import { departmentIdSchema, departmentInputSchema } from "@/schemas/department.schema";
import * as departmentService from "@/services/department.service";

/**
 * Server Actions de departamentos.
 *
 * Se tratan con el mismo recelo que un endpoint público: aunque la UI oculte
 * los botones, cualquiera puede invocarlas, así que cada una comprueba sesión
 * y vuelve a validar la entrada aunque el formulario ya lo haya hecho.
 */

const RUTA = "/departamentos";
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

export async function createDepartmentAction(
  input: unknown,
): Promise<Result<DepartmentRow>> {
  if (!(await getSessionUser())) {
    return fail("NO_AUTORIZADO", SIN_SESION);
  }

  const parsed = departmentInputSchema.safeParse(input);

  if (!parsed.success) {
    return fail("VALIDACION", DATOS_INVALIDOS, erroresPorCampo(parsed.error));
  }

  const resultado = await departmentService.createDepartment(parsed.data);

  if (resultado.success) {
    revalidatePath(RUTA);
  }

  return resultado;
}

export async function updateDepartmentAction(
  id: unknown,
  input: unknown,
): Promise<Result<DepartmentRow>> {
  if (!(await getSessionUser())) {
    return fail("NO_AUTORIZADO", SIN_SESION);
  }

  const parsedId = departmentIdSchema.safeParse(id);
  const parsed = departmentInputSchema.safeParse(input);

  if (!parsedId.success) {
    return fail("VALIDACION", "Identificador de departamento inválido.");
  }

  if (!parsed.success) {
    return fail("VALIDACION", DATOS_INVALIDOS, erroresPorCampo(parsed.error));
  }

  const resultado = await departmentService.updateDepartment(parsedId.data, parsed.data);

  if (resultado.success) {
    revalidatePath(RUTA);
  }

  return resultado;
}

export async function deleteDepartmentAction(id: unknown): Promise<Result<null>> {
  if (!(await getSessionUser())) {
    return fail("NO_AUTORIZADO", SIN_SESION);
  }

  const parsedId = departmentIdSchema.safeParse(id);

  if (!parsedId.success) {
    return fail("VALIDACION", "Identificador de departamento inválido.");
  }

  const resultado = await departmentService.deleteDepartment(parsedId.data);

  if (resultado.success) {
    revalidatePath(RUTA);
  }

  return resultado;
}
