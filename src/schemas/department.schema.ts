import { z } from "zod";

/**
 * Fuente única de verdad de la validación de departamentos: la importan tanto
 * el formulario (para dar feedback inmediato) como la Server Action (donde la
 * validación es obligatoria, porque la del cliente se puede saltar).
 */

// AdventureWorks define Name como nvarchar(50); lo respetamos aunque en
// PostgreSQL la columna haya quedado como `text`.
const LARGO_MAXIMO = 50;

export const departmentInputSchema = z.object({
  name: z
    .string({ error: "El nombre es obligatorio." })
    .trim()
    .min(2, { error: "El nombre debe tener al menos 2 caracteres." })
    .max(LARGO_MAXIMO, {
      error: `El nombre no puede exceder ${LARGO_MAXIMO} caracteres.`,
    }),
  groupName: z
    .string({ error: "El grupo es obligatorio." })
    .trim()
    .min(2, { error: "El grupo debe tener al menos 2 caracteres." })
    .max(LARGO_MAXIMO, {
      error: `El grupo no puede exceder ${LARGO_MAXIMO} caracteres.`,
    }),
});

export type DepartmentInput = z.infer<typeof departmentInputSchema>;

export const departmentIdSchema = z.coerce
  .number({ error: "Identificador inválido." })
  .int({ error: "Identificador inválido." })
  .positive({ error: "Identificador inválido." });

export const TAMANO_PAGINA = 10;

/**
 * Filtros que viajan por la URL. Usa `catch` en lugar de `default` para que
 * un `?page=abc` escrito a mano degrade a la página 1 en vez de reventar.
 */
export const departmentQuerySchema = z.object({
  q: z.string().trim().catch(""),
  page: z.coerce.number().int().min(1).catch(1),
});

export type DepartmentQuery = z.infer<typeof departmentQuerySchema>;
