import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/data/prisma";
import { extraerNombreDeCurriculum } from "@/features/candidatos/resume";
import type { CandidateQuery } from "@/features/candidatos/schemas";
import type {
  CandidateDetail,
  CandidateListItem,
  CandidateStatus,
} from "@/features/candidatos/types";

/**
 * Acceso a `humanresources.jobcandidate`.
 *
 * `businessEntityId` es la única fuente del estado: no nulo significa que el
 * candidato tiene un empleado asociado, es decir, que fue contratado. El
 * `LEFT JOIN` a `person` solo aporta el nombre cuando eso pasó; para el resto
 * se recurre al currículum (`resume.ts`), porque `JobCandidate` no tiene
 * nombre propio.
 */

type CandidateFilter = Omit<CandidateQuery, "page">;

type CandidateRow = {
  jobCandidateId: number;
  businessEntityId: number | null;
  resume: string | null;
  firstName: string | null;
  lastName: string | null;
};

function estadoDe(businessEntityId: number | null): CandidateStatus {
  return businessEntityId === null ? "pendiente" : "contratado";
}

function nombreDe(fila: CandidateRow): string | null {
  // El nombre de la persona contratada es el dato autoritativo; el del
  // currículum es lo mejor disponible mientras el candidato sigue pendiente.
  if (fila.firstName && fila.lastName) {
    return `${fila.lastName}, ${fila.firstName}`;
  }

  return extraerNombreDeCurriculum(fila.resume);
}

function condicionDeEstado(estado: CandidateFilter["estado"]): Prisma.Sql {
  if (estado === "pendientes") {
    return Prisma.sql`jc.businessentityid IS NULL`;
  }

  if (estado === "contratados") {
    return Prisma.sql`jc.businessentityid IS NOT NULL`;
  }

  return Prisma.sql`TRUE`;
}

export async function listCandidates({
  estado,
  skip,
  take,
}: CandidateFilter & { skip: number; take: number }): Promise<CandidateListItem[]> {
  const condicion = condicionDeEstado(estado);

  const filas = await prisma.$queryRaw<CandidateRow[]>`
    SELECT jc.jobcandidateid   AS "jobCandidateId",
           jc.businessentityid AS "businessEntityId",
           jc.resume           AS "resume",
           p.firstname         AS "firstName",
           p.lastname          AS "lastName"
    FROM humanresources.jobcandidate jc
    LEFT JOIN person.person p ON p.businessentityid = jc.businessentityid
    WHERE ${condicion}
    ORDER BY jc.jobcandidateid ASC
    LIMIT ${take} OFFSET ${skip}
  `;

  return filas.map((fila) => ({
    jobCandidateId: fila.jobCandidateId,
    status: estadoDe(fila.businessEntityId),
    name: nombreDe(fila),
  }));
}

export async function countCandidates(
  estado: CandidateFilter["estado"],
): Promise<number> {
  const condicion = condicionDeEstado(estado);

  const filas = await prisma.$queryRaw<{ total: number }[]>`
    SELECT count(*)::int AS total
    FROM humanresources.jobcandidate jc
    WHERE ${condicion}
  `;

  return filas[0]?.total ?? 0;
}

export async function findCandidateById(
  jobCandidateId: number,
): Promise<CandidateDetail | null> {
  const filas = await prisma.$queryRaw<(CandidateRow & { modifiedDate: Date })[]>`
    SELECT jc.jobcandidateid   AS "jobCandidateId",
           jc.businessentityid AS "businessEntityId",
           jc.resume           AS "resume",
           jc.modifieddate     AS "modifiedDate",
           p.firstname         AS "firstName",
           p.lastname          AS "lastName"
    FROM humanresources.jobcandidate jc
    LEFT JOIN person.person p ON p.businessentityid = jc.businessentityid
    WHERE jc.jobcandidateid = ${jobCandidateId}
    LIMIT 1
  `;

  const fila = filas[0];

  if (!fila) {
    return null;
  }

  return {
    jobCandidateId: fila.jobCandidateId,
    status: estadoDe(fila.businessEntityId),
    name: nombreDe(fila),
    modifiedDate: fila.modifiedDate,
    resume: fila.resume,
  };
}
