"use server";

import {
  getHeadcountByDepartment,
  getHeadcountByShift,
} from "@/features/reportes/services/headcount.service";
import type {
  HeadcountByDepartmentRow,
  HeadcountByShiftRow,
  HeadcountReport,
} from "@/features/reportes/types";
import { fail, type Result } from "@/lib/result";
import { getSessionUser } from "@/lib/session";

const SIN_SESION = "Tu sesión expiró. Iniciá sesión de nuevo para continuar.";

export async function getHeadcountByDepartmentAction(): Promise<
  Result<HeadcountReport<HeadcountByDepartmentRow>>
> {
  if (!(await getSessionUser())) {
    return fail("NO_AUTORIZADO", SIN_SESION);
  }

  return getHeadcountByDepartment();
}

export async function getHeadcountByShiftAction(): Promise<
  Result<HeadcountReport<HeadcountByShiftRow>>
> {
  if (!(await getSessionUser())) {
    return fail("NO_AUTORIZADO", SIN_SESION);
  }

  return getHeadcountByShift();
}
