"use server";

import { fail, type Result } from "@/lib/result";
import { getSessionUser } from "@/lib/session";
import { salaryLogQuerySchema } from "@/features/procesos/schemas";
import {
  getSalaryLogPage,
  type SalaryLogPage,
} from "@/features/procesos/services/salaries.service";

const SIN_SESION = "Tu sesión expiró. Iniciá sesión de nuevo para continuar.";

export async function getSalaryLogPageAction(
  input: unknown,
): Promise<Result<SalaryLogPage>> {
  if (!(await getSessionUser())) {
    return fail("NO_AUTORIZADO", SIN_SESION);
  }

  const parsed = salaryLogQuerySchema.safeParse(input);

  if (!parsed.success) {
    return fail("VALIDACION", "Los filtros del historial salarial no son válidos.");
  }

  return getSalaryLogPage(parsed.data);
}
