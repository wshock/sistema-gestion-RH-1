import { z } from "zod";

import * as employeeRead from "@/features/empleados/data/read";
import * as employeeData from "@/features/empleados/data/write";
import { fail, ok, unexpected, type Result } from "@/lib/result";
import { toUtcCalendarDate } from "@/features/empleados/format";
import type {
  EmployeeCreateInput,
  EmployeeEditInput,
  SalaryChangeInput,
} from "@/features/empleados/schemas";
import { crearSalaryChangeSchema } from "@/features/empleados/schemas";
import type { EmployeeWriteRow } from "@/features/empleados/data/write";
import type { EmployeePayRecord } from "@/features/empleados/types";
import { currentPay } from "@/features/empleados/vigencia";

/**
 * Reglas de negocio de la escritura de empleados.
 *
 * El alta comprueba unicidad y existencia de catálogos antes de abrir la
 * transacción: si el documento ya está o el departamento desapareció, no
 * tiene sentido empezar a escribir. Un fallo a mitad de las cinco tablas lo
 * revierte Prisma.
 */

export async function createEmployee(
  input: EmployeeCreateInput,
): Promise<Result<EmployeeWriteRow>> {
  try {
    const documentoRepetido = await employeeData.findEmployeeIdByNationalId(
      input.nationalIdNumber,
    );

    if (documentoRepetido !== null) {
      return fail(
        "DUPLICADO",
        `Ya existe un empleado con el documento "${input.nationalIdNumber}".`,
        { nationalIdNumber: ["Ese documento ya está en uso."] },
      );
    }

    const usuarioRepetido = await employeeData.findEmployeeIdByLoginId(input.loginId);

    if (usuarioRepetido !== null) {
      return fail(
        "DUPLICADO",
        `Ya existe un empleado con el usuario "${input.loginId}".`,
        {
          loginId: ["Ese usuario de red ya está en uso."],
        },
      );
    }

    if (!(await employeeData.departmentExists(input.departmentId))) {
      return fail("NO_ENCONTRADO", "El departamento seleccionado ya no existe.", {
        departmentId: ["Ese departamento ya no está disponible."],
      });
    }

    if (!(await employeeData.shiftExists(input.shiftId))) {
      return fail("NO_ENCONTRADO", "El turno seleccionado ya no existe.", {
        shiftId: ["Ese turno ya no está disponible."],
      });
    }

    return ok(await employeeData.createEmployee(input));
  } catch (error) {
    return unexpected("createEmployee", error);
  }
}

/**
 * La unicidad de documento y usuario se vuelve a comprobar acá, excluyendo al
 * propio empleado: sin eso, guardar la ficha sin cambiar el documento se
 * marcaría a sí misma como duplicada.
 */
export async function updateEmployee(
  businessEntityId: number,
  input: EmployeeEditInput,
): Promise<Result<EmployeeWriteRow>> {
  try {
    if (!(await employeeData.employeeExists(businessEntityId))) {
      return fail("NO_ENCONTRADO", "El empleado que intentás editar ya no existe.");
    }

    const documentoRepetido = await employeeData.findEmployeeIdByNationalId(
      input.nationalIdNumber,
      businessEntityId,
    );

    if (documentoRepetido !== null) {
      return fail(
        "DUPLICADO",
        `Ya existe un empleado con el documento "${input.nationalIdNumber}".`,
        { nationalIdNumber: ["Ese documento ya está en uso."] },
      );
    }

    const usuarioRepetido = await employeeData.findEmployeeIdByLoginId(
      input.loginId,
      businessEntityId,
    );

    if (usuarioRepetido !== null) {
      return fail(
        "DUPLICADO",
        `Ya existe un empleado con el usuario "${input.loginId}".`,
        { loginId: ["Ese usuario de red ya está en uso."] },
      );
    }

    return ok(await employeeData.updateEmployee(businessEntityId, input));
  } catch (error) {
    return unexpected("updateEmployee", error);
  }
}

/**
 * Baja y reactivación son la misma operación de negocio: no hay más regla
 * que "el empleado tiene que existir". No se comprueba el estado actual
 * porque no hay nada malo en confirmar dos veces la misma baja.
 */
export async function setEmployeeStatus(
  businessEntityId: number,
  currentFlag: boolean,
): Promise<Result<EmployeeWriteRow>> {
  try {
    if (!(await employeeData.employeeExists(businessEntityId))) {
      return fail("NO_ENCONTRADO", "El empleado que intentás actualizar ya no existe.");
    }

    return ok(await employeeData.setEmployeeStatus(businessEntityId, currentFlag));
  } catch (error) {
    return unexpected("setEmployeeStatus", error);
  }
}

function erroresPorCampo<T>(error: z.ZodError<T>): Record<string, string[]> {
  const fieldErrors: Record<string, string[] | undefined> =
    z.flattenError(error).fieldErrors;

  return Object.fromEntries(
    Object.entries(fieldErrors).filter((entrada): entrada is [string, string[]] =>
      Boolean(entrada[1]?.length),
    ),
  );
}

function esClaveDuplicada(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

/**
 * Registra un salario nuevo. Solo inserta: el historial anterior queda
 * intacto. Las reglas cronológicas (HU-35) se aplican con el mismo esquema
 * que el formulario, usando contratación e historial leídos de la base.
 */
export async function registerSalaryChange(
  input: SalaryChangeInput,
): Promise<Result<EmployeePayRecord>> {
  try {
    const empleado = await employeeRead.findEmployeeById(input.businessEntityId);

    if (!empleado) {
      return fail("NO_ENCONTRADO", "El empleado solicitado no existe.");
    }

    const historial = await employeeRead.listPayHistory(input.businessEntityId);
    const vigente = currentPay(historial);
    const parsed = crearSalaryChangeSchema({
      hireDate: empleado.hireDate,
      lastPayDate: vigente ? toUtcCalendarDate(vigente.rateChangeDate) : null,
    }).safeParse(input);

    if (!parsed.success) {
      return fail(
        "VALIDACION",
        "Revisá los datos del formulario.",
        erroresPorCampo(parsed.error),
      );
    }

    return ok(await employeeData.insertPayHistory(parsed.data));
  } catch (error) {
    if (esClaveDuplicada(error)) {
      return fail("DUPLICADO", "Ya existe un cambio salarial en esa fecha.", {
        rateChangeDate: ["Ya hay un cambio salarial registrado en esa fecha."],
      });
    }

    return unexpected("registerSalaryChange", error);
  }
}
