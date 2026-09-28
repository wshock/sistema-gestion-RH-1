import { z } from "zod";

/**
 * Validación del módulo de reportes.
 *
 * Hoy solo parametriza la paginación del detalle de antigüedad. Los filtros
 * futuros (departamento, tramo) se agregan acá para que viajen por la URL.
 */

export const TAMANO_PAGINA_ANTIGUEDAD = 20;

/**
 * Query del reporte de antigüedad. Usa `catch` para que un `?page=abc`
 * escrito a mano degrade a la página 1 en vez de reventar.
 */
export const seniorityQuerySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
});

export type SeniorityQuery = z.infer<typeof seniorityQuerySchema>;
