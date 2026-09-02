import * as employeeRead from "@/features/empleados/data/read";
import * as employeeData from "@/features/empleados/data/write";
import { fail, ok, unexpected, type Result } from "@/lib/result";
import { toUtcCalendarDate } from "@/features/empleados/format";
import type {
  EmployeeCreateInput,
  SalaryChangeInput,
} from "@/features/empleados/schemas";
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
 * intacto y el vigente pasa a ser este registro si su fecha es la más
 * reciente —la misma regla que usa la ficha.
 */
export async function registerSalaryChange(
  input: SalaryChangeInput,
): Promise<Result<EmployeePayRecord>> {
  try {
    const empleado = await employeeRead.findEmployeeById(input.businessEntityId);

    if (!empleado) {
      return fail("NO_ENCONTRADO", "El empleado solicitado no existe.");
    }

    if (input.rateChangeDate < empleado.hireDate) {
      return fail(
        "CONFLICTO",
        "La fecha de cambio no puede ser anterior a la contratación.",
        {
          rateChangeDate: ["La fecha de cambio no puede ser anterior a la contratación."],
        },
      );
    }

    const historial = await employeeRead.listPayHistory(input.businessEntityId);
    const vigente = currentPay(historial);

    if (vigente && input.rateChangeDate <= toUtcCalendarDate(vigente.rateChangeDate)) {
      return fail(
        "CONFLICTO",
        "La fecha de cambio debe ser posterior a la del salario vigente.",
        {
          rateChangeDate: [
            "Ya hay un salario en esa fecha o en una posterior. Indicá una fecha más reciente.",
          ],
        },
      );
    }

    return ok(await employeeData.insertPayHistory(input));
  } catch (error) {
    if (esClaveDuplicada(error)) {
      return fail("DUPLICADO", "Ya existe un cambio salarial en esa fecha.", {
        rateChangeDate: ["Ya hay un cambio salarial registrado en esa fecha."],
      });
    }

    return unexpected("registerSalaryChange", error);
  }
}
