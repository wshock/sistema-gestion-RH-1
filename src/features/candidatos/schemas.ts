import { z } from "zod";

/**
 * Validación del módulo de candidatos: filtros del listado y el alta/edición
 * del currículum, que la comparten el formulario y la Server Action.
 */

export const TAMANO_PAGINA = 20;

// `Resume` era `nvarchar(max)`/`xml` sin límite en AdventureWorks; se acota
// para evitar que un pegado accidental de un documento entero reviente el
// campo de texto.
const LARGO_MAXIMO_CURRICULUM = 8000;

/**
 * Alta y edición de un candidato.
 *
 * `JobCandidate` no tiene más campos propios que el currículum —el nombre,
 * cuando existe, sale de otro lado (ver `types.ts`)—, así que es todo lo que
 * pide el formulario.
 */
export const candidateInputSchema = z.object({
  resume: z
    .string({ error: "El currículum es obligatorio." })
    .trim()
    .min(1, { error: "El currículum es obligatorio." })
    .max(LARGO_MAXIMO_CURRICULUM, {
      error: `El currículum no puede exceder ${LARGO_MAXIMO_CURRICULUM} caracteres.`,
    }),
});

export type CandidateInput = z.infer<typeof candidateInputSchema>;

/**
 * Filtros del listado, en la URL. `catch` en lugar de `default` para que un
 * parámetro escrito a mano degrade en vez de reventar.
 */
export const candidateQuerySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  estado: z.enum(["todos", "pendientes", "contratados"]).catch("todos"),
});

export type CandidateQuery = z.infer<typeof candidateQuerySchema>;

export const candidateIdSchema = z.coerce
  .number({ error: "Identificador inválido." })
  .int({ error: "Identificador inválido." })
  .positive({ error: "Identificador inválido." });
