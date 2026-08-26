import * as employeeData from "@/features/empleados/data/write";
import { fail, ok, unexpected, type Result } from "@/lib/result";
import type { EmployeeCreateInput } from "@/features/empleados/schemas";
import type { EmployeeWriteRow } from "@/features/empleados/data/write";

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
