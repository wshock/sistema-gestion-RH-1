import { prisma } from "@/data/prisma";
import type { EmployeeCreateInput } from "@/features/empleados/schemas";

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
 * Inserta un cambio salarial. No actualiza ni borra filas anteriores: el
 * vigente lo decide `currentPay` por la fecha más reciente.
 */
export async function insertPayHistory(input: {
  businessEntityId: number;
  rate: number;
  payFrequency: 1 | 2;
  rateChangeDate: string;
}): Promise<{ rateChangeDate: Date; rate: number; payFrequency: 1 | 2 }> {
  const ahora = new Date();
  const fila = await prisma.employeePayHistory.create({
    data: {
      businessEntityId: input.businessEntityId,
      rateChangeDate: fechaDeCalendario(input.rateChangeDate),
      rate: input.rate,
      payFrequency: input.payFrequency,
      modifiedDate: ahora,
    },
    select: {
      rateChangeDate: true,
      rate: true,
      payFrequency: true,
    },
  });

  return {
    rateChangeDate: fila.rateChangeDate,
    rate: Number(fila.rate),
    payFrequency: fila.payFrequency === 2 ? 2 : 1,
  };
}
