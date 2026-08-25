import { z } from "zod";

/**
 * Validación del módulo de candidatos. Solo hay filtros de listado —no hay
 * formulario propio en este sprint—, así que es más chico que el de
 * departamentos o turnos.
 */

export const TAMANO_PAGINA = 20;

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
