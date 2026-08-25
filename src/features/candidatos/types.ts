/**
 * Tipos del módulo de candidatos.
 *
 * `JobCandidate` no tiene nombre propio: el de un candidato contratado sale
 * de `Person` a través del empleado que se le asoció; el de uno pendiente,
 * cuando se puede, se extrae de su currículum (ver `resume.ts`). Por eso
 * `name` es `string | null` en los dos tipos: no siempre hay de dónde
 * sacarlo.
 */

/**
 * Un candidato se considera contratado cuando tiene un empleado asociado
 * (`JobCandidate.businessEntityId` no nulo). El Sprint 3 establece ese
 * vínculo con el proceso de contratación; acá solo se lee.
 */
export type CandidateStatus = "pendiente" | "contratado";

export type CandidateListItem = {
  jobCandidateId: number;
  status: CandidateStatus;
  name: string | null;
};

export type CandidateDetail = {
  jobCandidateId: number;
  status: CandidateStatus;
  name: string | null;
  modifiedDate: Date;
  /** Texto migrado del XML original. `null` si el candidato no tiene currículum registrado. */
  resume: string | null;
};
