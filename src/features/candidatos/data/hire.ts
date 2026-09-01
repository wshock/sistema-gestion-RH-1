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

/**
 * Señal de que el candidato se contrató entre que el servicio lo comprobó y
 * que la transacción llegó a vincularlo —dos pestañas, o dos personas del
 * equipo, confirmando la misma contratación a la vez—. El resto de las
 * comprobaciones (documento, departamento, turno) se hacen antes de abrir la
 * transacción, que es lo que el criterio de HU-31 permite; esta es la única
 * que vale la pena repetir de forma atómica: es la misma fila que la
 * transacción ya va a escribir al final, así que la relectura no cuesta una
 * consulta extra.
 */
export class CandidatoYaContratadoError extends Error {
  constructor() {
    super("El candidato se contrató en otra operación mientras esta estaba en curso.");
    this.name = "CandidatoYaContratadoError";
  }
}

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
    // existe de verdad. La condición `businessEntityId: null` en el `where`
    // es la comprobación atómica: si otra operación ya vinculó a este
    // candidato entre que el servicio lo comprobó y que la transacción llegó
    // hasta acá, `updateMany` no toca ninguna fila en lugar de pisar el
    // vínculo existente, y se aborta toda la transacción —persona, empleado
    // e historiales incluidos— en vez de dejar un empleado huérfano de
    // candidato.
    const vinculado = await tx.jobCandidate.updateMany({
      where: { jobCandidateId, businessEntityId: null },
      data: { businessEntityId, modifiedDate: ahora },
    });

    if (vinculado.count === 0) {
      throw new CandidatoYaContratadoError();
    }

    return { businessEntityId };
  });
}
