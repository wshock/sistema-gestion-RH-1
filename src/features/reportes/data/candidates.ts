import { prisma } from "@/data/prisma";

/**
 * Consultas del reporte de estado de candidatos.
 *
 * El estado se deduce igual que en el módulo de candidatos: pendiente si
 * `businessentityid` es nulo, contratado si no. Una sola agregación en la
 * base evita traer filas a memoria solo para contarlas.
 */

export type CandidateStatusCounts = {
  pending: number;
  hired: number;
  total: number;
};

export async function countCandidatesByStatus(): Promise<CandidateStatusCounts> {
  const filas = await prisma.$queryRaw<CandidateStatusCounts[]>`
    SELECT count(*) FILTER (WHERE businessentityid IS NULL)::int     AS pending,
           count(*) FILTER (WHERE businessentityid IS NOT NULL)::int AS hired,
           count(*)::int                                             AS total
    FROM humanresources.jobcandidate
  `;

  return filas[0] ?? { pending: 0, hired: 0, total: 0 };
}
