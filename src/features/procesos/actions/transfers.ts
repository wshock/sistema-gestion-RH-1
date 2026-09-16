"use server";

import { fail, type Result } from "@/lib/result";
import { getSessionUser } from "@/lib/session";
import {
  transferLogQuerySchema,
  type TransferLogQuery,
} from "@/features/procesos/schemas";
import {
  getTransferLogPage,
  type TransferLogPage,
} from "@/features/procesos/services/transfers.service";

const SIN_SESION = "Tu sesión expiró. Iniciá sesión de nuevo para continuar.";

export async function getTransferLogPageAction(
  input: unknown,
): Promise<Result<TransferLogPage>> {
  if (!(await getSessionUser())) {
    return fail("NO_AUTORIZADO", SIN_SESION);
  }

  const parsed = transferLogQuerySchema.safeParse(input);

  if (!parsed.success) {
    return fail("VALIDACION", "Los filtros del historial no son válidos.");
  }

  return getTransferLogPage(parsed.data as TransferLogQuery);
}
