import { prisma } from "@/data/prisma";
import type { CandidateInput } from "@/features/candidatos/schemas";

/**
 * Escritura sobre `humanresources.jobcandidate`.
 *
 * Una sola tabla, un solo campo propio (`resume`): no hace falta transacción.
 */

export type CandidateWriteRow = { jobCandidateId: number };

export function createCandidate({ resume }: CandidateInput): Promise<CandidateWriteRow> {
  return prisma.jobCandidate.create({
    data: { resume, modifiedDate: new Date() },
    select: { jobCandidateId: true },
  });
}

export function updateCandidate(
  jobCandidateId: number,
  { resume }: CandidateInput,
): Promise<CandidateWriteRow> {
  return prisma.jobCandidate.update({
    where: { jobCandidateId },
    data: { resume, modifiedDate: new Date() },
    select: { jobCandidateId: true },
  });
}

/**
 * Lo mínimo para decidir si la edición o el borrado proceden: si tiene
 * empleado asociado, ya fue contratado —no se edita ni se elimina—.
 * Separada de `findCandidateById` (en `data/read.ts`) porque esta no
 * necesita resolver nombre ni currículum, solo el estado.
 */
export function findCandidateForWrite(
  jobCandidateId: number,
): Promise<{ jobCandidateId: number; businessEntityId: number | null } | null> {
  return prisma.jobCandidate.findUnique({
    where: { jobCandidateId },
    select: { jobCandidateId: true, businessEntityId: true },
  });
}

export function deleteCandidate(jobCandidateId: number): Promise<CandidateWriteRow> {
  return prisma.jobCandidate.delete({
    where: { jobCandidateId },
    select: { jobCandidateId: true },
  });
}
