import { prisma } from "@/data/prisma";
import type { HireCandidateInput } from "@/features/candidatos/schemas";

/**
 * Escritura de la contratación.
 *
 * Cinco tablas en una transacción, en el orden que imponen las claves
 * foráneas: `BusinessEntity` → `Person` → `Employee` → sus dos historiales.
 * El vínculo del candidato va al final, cuando ya existe el
 * `businessEntityId` con el que vincularlo. Amplía el patrón del alta de
 * empleado del Sprint 2 (`src/features/empleados/data/write.ts`) con los dos
 * registros de historial y ese vínculo.
 *
 * Las columnas `date` se arman a medianoche UTC a partir de `"AAAA-MM-DD"`
 * para no desplazar el día al persistirlas.
 */

export type HireResult = { businessEntityId: number };

/** El nombre y apellido propios del candidato (`JobCandidate.firstName`/`.lastName`). */
export type NombreDeCandidato = { firstName: string; lastName: string };

function fechaDeCalendario(iso: string): Date {
  const [anio, mes, dia] = iso.split("-").map(Number);

  return new Date(Date.UTC(anio, mes - 1, dia));
}

/** Quita tildes y todo lo que no sea letra latina, para un usuario de red estable. */
function normalizarParaLogin(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // marcas diacríticas (tildes, diéresis) tras NFD
    .replace(/[^a-zA-Z]/g, "")
    .toLowerCase();
}

/**
 * `Employee.loginId` es obligatorio, pero el formulario de contratación no lo
 * pide —`JobCandidate` no tiene uno que heredar—: se genera con la
 * convención habitual de "nombre.apellido", como haría cualquier alta real de
 * usuario de red.
 */
function generarLoginId({ firstName, lastName }: NombreDeCandidato): string {
  const usuario = `${normalizarParaLogin(firstName)}.${normalizarParaLogin(lastName)}`;

  // `varchar(256)` en la base; un nombre extremo no debería reventar la
  // escritura.
  return usuario.slice(0, 256);
}

export function hireCandidate(
  jobCandidateId: number,
  nombre: NombreDeCandidato,
  input: HireCandidateInput,
): Promise<HireResult> {
  const nacimiento = fechaDeCalendario(input.birthDate);
  const contratacion = fechaDeCalendario(input.hireDate);
  const ahora = new Date();
  const loginId = generarLoginId(nombre);

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
        firstName: nombre.firstName,
        lastName: nombre.lastName,
        modifiedDate: ahora,
      },
    });

    await tx.employee.create({
      data: {
        businessEntityId,
        nationalIdNumber: input.nationalIdNumber,
        loginId,
        jobTitle: input.jobTitle,
        birthDate: nacimiento,
        maritalStatus: input.maritalStatus,
        gender: input.gender,
        hireDate: contratacion,
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

    // Último paso: el vínculo solo tiene sentido una vez que el empleado
    // existe de verdad.
    await tx.jobCandidate.update({
      where: { jobCandidateId },
      data: { businessEntityId, modifiedDate: ahora },
    });

    return { businessEntityId };
  });
}
