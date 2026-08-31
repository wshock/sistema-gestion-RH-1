import { prisma } from "@/data/prisma";
import * as candidateData from "@/features/candidatos/data/read";
import * as hireData from "@/features/candidatos/data/hire";
import type { HireResult } from "@/features/candidatos/data/hire";
import type { HireCandidateInput } from "@/features/candidatos/schemas";
import type { CandidateDetail } from "@/features/candidatos/types";
import { fail, ok, unexpected, type Result } from "@/lib/result";

/**
 * Lectura del candidato para la pantalla de contratación (HU-29).
 *
 * Reutiliza `findCandidateById`: la pantalla necesita exactamente los mismos
 * datos que la ficha de lectura (nombre, estado, currículum) para mostrarlos
 * como referencia no editable. La diferencia es que acá el estado además
 * decide si se puede entrar: un candidato ya contratado no inicia el proceso
 * de nuevo.
 */
export async function getCandidateForHire(
  jobCandidateId: number,
): Promise<Result<CandidateDetail>> {
  try {
    const candidato = await candidateData.findCandidateById(jobCandidateId);

    if (!candidato) {
      return fail("NO_ENCONTRADO", "El candidato solicitado no existe.");
    }

    if (candidato.status === "contratado") {
      return fail(
        "CONFLICTO",
        "Este candidato ya fue contratado: no se puede iniciar el proceso de nuevo.",
      );
    }

    return ok(candidato);
  } catch (error) {
    return unexpected("getCandidateForHire", error);
  }
}

/**
 * Ejecuta la contratación (HU-30): comprueba que se pueda, y si es así,
 * delega la escritura transaccional a `data/hire.ts`.
 *
 * Todas las comprobaciones van antes de abrir la transacción, para no llegar
 * a escribir nada si alguna falla:
 *
 * - El candidato existe y sigue pendiente (reutiliza `getCandidateForHire`).
 * - Tiene nombre y apellido propios: `Person` los exige, y desde que
 *   `firstName`/`lastName` son campos de `JobCandidate` (no algo que se
 *   intentaba extraer del currículum), solo falta en candidatos migrados
 *   antes de este cambio y sin nombre resoluble en su momento.
 * - El documento no está en uso por otro empleado, y el departamento y el
 *   turno elegidos siguen existiendo —mismo criterio que el alta de
 *   empleado del Sprint 2—.
 */
export async function hireCandidate(
  jobCandidateId: number,
  input: HireCandidateInput,
): Promise<Result<HireResult>> {
  try {
    const elegible = await getCandidateForHire(jobCandidateId);

    if (!elegible.success) {
      return elegible;
    }

    const { firstName, lastName } = elegible.data;

    if (!firstName || !lastName) {
      return fail(
        "VALIDACION",
        "Este candidato no tiene nombre y apellido registrados. Editalo para completarlos antes de contratarlo.",
      );
    }

    const documentoRepetido = await prisma.employee.findFirst({
      where: { nationalIdNumber: input.nationalIdNumber },
      select: { businessEntityId: true },
    });

    if (documentoRepetido !== null) {
      return fail(
        "DUPLICADO",
        `Ya existe un empleado con el documento "${input.nationalIdNumber}".`,
        { nationalIdNumber: ["Ese documento ya está en uso."] },
      );
    }

    const [departamento, turno] = await Promise.all([
      prisma.department.findUnique({
        where: { departmentId: input.departmentId },
        select: { departmentId: true },
      }),
      prisma.shift.findUnique({
        where: { shiftId: input.shiftId },
        select: { shiftId: true },
      }),
    ]);

    if (!departamento) {
      return fail("NO_ENCONTRADO", "El departamento seleccionado ya no existe.", {
        departmentId: ["Ese departamento ya no está disponible."],
      });
    }

    if (!turno) {
      return fail("NO_ENCONTRADO", "El turno seleccionado ya no existe.", {
        shiftId: ["Ese turno ya no está disponible."],
      });
    }

    return ok(
      await hireData.hireCandidate(jobCandidateId, { firstName, lastName }, input),
    );
  } catch (error) {
    return unexpected("hireCandidate", error);
  }
}
