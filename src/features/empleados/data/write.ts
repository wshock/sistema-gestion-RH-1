import { prisma } from "@/data/prisma";
import type {
  EmployeeCreateInput,
  EmployeeEditInput,
} from "@/features/empleados/schemas";

/**
 * Escritura de empleados.
 *
 * El alta toca cinco tablas y tiene que ser todo o nada: una persona sin
 * empleado, o un empleado sin asignación, dejaría la ficha a medias. Por eso
 * las inserciones viven dentro de `prisma.$transaction`.
 *
 * Las columnas `date` se arman a medianoche UTC a partir de `"AAAA-MM-DD"`
 * para no desplazar el día al persistirlas (el mismo problema que al leerlas).
 */

export type EmployeeWriteRow = { businessEntityId: number };

/** Convierte `"AAAA-MM-DD"` en un `Date` anclado a UTC, para columnas `date`. */
function fechaDeCalendario(iso: string): Date {
  const [anio, mes, dia] = iso.split("-").map(Number);

  return new Date(Date.UTC(anio, mes - 1, dia));
}

export async function findEmployeeIdByNationalId(
  nationalIdNumber: string,
  excluirId?: number,
): Promise<number | null> {
  const fila = await prisma.employee.findFirst({
    where: {
      nationalIdNumber,
      ...(excluirId !== undefined ? { businessEntityId: { not: excluirId } } : {}),
    },
    select: { businessEntityId: true },
  });

  return fila?.businessEntityId ?? null;
}

export async function findEmployeeIdByLoginId(
  loginId: string,
  excluirId?: number,
): Promise<number | null> {
  const fila = await prisma.employee.findFirst({
    where: {
      loginId,
      ...(excluirId !== undefined ? { businessEntityId: { not: excluirId } } : {}),
    },
    select: { businessEntityId: true },
  });

  return fila?.businessEntityId ?? null;
}

export function departmentExists(departmentId: number): Promise<boolean> {
  return prisma.department
    .findUnique({ where: { departmentId }, select: { departmentId: true } })
    .then((fila) => fila !== null);
}

export function shiftExists(shiftId: number): Promise<boolean> {
  return prisma.shift
    .findUnique({ where: { shiftId }, select: { shiftId: true } })
    .then((fila) => fila !== null);
}

export function employeeExists(businessEntityId: number): Promise<boolean> {
  return prisma.employee
    .findUnique({ where: { businessEntityId }, select: { businessEntityId: true } })
    .then((fila) => fila !== null);
}

/**
 * Crea persona, empleado, asignación inicial y salario inicial.
 *
 * `personType` es `EM` (empleado), el valor mayoritario de la plantilla
 * migrada. `currentFlag` queda en `true`: la baja es otra operación.
 * La primera asignación y el primer salario usan la fecha de contratación.
 */
export function createEmployee(input: EmployeeCreateInput): Promise<EmployeeWriteRow> {
  const nacimiento = fechaDeCalendario(input.birthDate);
  const contratacion = fechaDeCalendario(input.hireDate);
  const ahora = new Date();

  return prisma.$transaction(async (tx) => {
    const entidad = await tx.businessEntity.create({
      data: { modifiedDate: ahora },
      select: { businessEntityId: true },
    });

    const { businessEntityId } = entidad;

    await tx.person.create({
      data: {
        businessEntityId,
        personType: "EM",
        title: input.title,
        firstName: input.firstName,
        middleName: input.middleName,
        lastName: input.lastName,
        suffix: input.suffix,
        modifiedDate: ahora,
      },
    });

    await tx.employee.create({
      data: {
        businessEntityId,
        nationalIdNumber: input.nationalIdNumber,
        loginId: input.loginId,
        jobTitle: input.jobTitle,
        birthDate: nacimiento,
        maritalStatus: input.maritalStatus,
        gender: input.gender,
        hireDate: contratacion,
        salariedFlag: input.salariedFlag,
        vacationHours: input.vacationHours,
        sickLeaveHours: input.sickLeaveHours,
        currentFlag: true,
        modifiedDate: ahora,
      },
    });

    await tx.employeeDepartmentHistory.create({
      data: {
        businessEntityId,
        departmentId: input.departmentId,
        shiftId: input.shiftId,
        startDate: contratacion,
        endDate: null,
        modifiedDate: ahora,
      },
    });

    await tx.employeePayHistory.create({
      data: {
        businessEntityId,
        rateChangeDate: contratacion,
        rate: input.rate,
        payFrequency: input.payFrequency,
        modifiedDate: ahora,
      },
    });

    return { businessEntityId };
  });
}

/**
 * Actualiza los datos propios de la persona y del empleado, en una
 * transacción porque son dos tablas que deben quedar coherentes entre sí.
 *
 * No incluye `departmentId`, `shiftId` ni `rate`: `EmployeeEditInput` no los
 * declara, así que no hay forma de que esta función los toque por accidente.
 * Esos cambian por traslado y cambio salarial, que dejan historial —editarlos
 * junto con el resto de la ficha lo destruiría—.
 */
export function updateEmployee(
  businessEntityId: number,
  input: EmployeeEditInput,
): Promise<EmployeeWriteRow> {
  const nacimiento = fechaDeCalendario(input.birthDate);
  const contratacion = fechaDeCalendario(input.hireDate);
  const ahora = new Date();

  return prisma.$transaction(async (tx) => {
    await tx.person.update({
      where: { businessEntityId },
      data: {
        title: input.title,
        firstName: input.firstName,
        middleName: input.middleName,
        lastName: input.lastName,
        suffix: input.suffix,
        modifiedDate: ahora,
      },
    });

    await tx.employee.update({
      where: { businessEntityId },
      data: {
        nationalIdNumber: input.nationalIdNumber,
        loginId: input.loginId,
        jobTitle: input.jobTitle,
        birthDate: nacimiento,
        maritalStatus: input.maritalStatus,
        gender: input.gender,
        hireDate: contratacion,
        salariedFlag: input.salariedFlag,
        vacationHours: input.vacationHours,
        sickLeaveHours: input.sickLeaveHours,
        modifiedDate: ahora,
      },
    });

    return { businessEntityId };
  });
}
