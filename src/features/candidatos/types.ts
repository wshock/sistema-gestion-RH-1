/**
 * Tipos del módulo de candidatos.
 *
 * `firstName`/`lastName` son campos propios de `JobCandidate` (ver
 * `migration/add_jobcandidate_name_columns.sql`): antes se intentaban extraer
 * del currículum con expresiones regulares, pero un currículum es texto
 * libre y no siempre trae de dónde sacarlos. `name` sigue existiendo como
 * texto de presentación ya armado ("Apellido, Nombre"), resuelto en la capa
 * de datos a partir de esos campos —o de `Person`, si el candidato ya fue
 * contratado—.
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
  /** "Apellido, Nombre", ya armado. `null` solo para un candidato migrado antes de que el nombre fuera un campo propio y sin nombre resoluble en su currículum. */
  name: string | null;
};

export type CandidateDetail = {
  jobCandidateId: number;
  status: CandidateStatus;
  name: string | null;
  /** `null` en los mismos casos que `name`; ambos van juntos. */
  firstName: string | null;
  lastName: string | null;
  modifiedDate: Date;
  /** Texto del currículum. `null` si el candidato no tiene uno registrado. */
  resume: string | null;
};
