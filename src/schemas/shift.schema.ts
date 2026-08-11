import { z } from "zod";

/**
 * Fuente única de verdad de la validación de turnos: la importan tanto el
 * formulario (para dar feedback inmediato) como la Server Action (donde la
 * validación es obligatoria, porque la del cliente se puede saltar).
 *
 * Las horas viajan como texto `HH:MM` en 24 h, no como `Date`. Es lo que
 * produce y consume `<input type="time">`, sobrevive la serialización entre
 * servidor y cliente sin sorpresas, y —sobre todo— no arrastra zona horaria:
 * un turno empieza a las 23:00 en la empresa, no a las 23:00 de un huso
 * concreto.
 */

// AdventureWorks define Name como nvarchar(50); lo respetamos aunque en
// PostgreSQL la columna haya quedado como `text`.
const LARGO_MAXIMO = 50;

/** `HH:MM` en 24 h, con 00 ≤ HH ≤ 23 y 00 ≤ MM ≤ 59. */
const HORA_24H = /^([01]\d|2[0-3]):[0-5]\d$/;

const horaSchema = (campo: string) =>
  z
    .string({ error: `La hora de ${campo} es obligatoria.` })
    .trim()
    .min(1, { error: `La hora de ${campo} es obligatoria.` })
    .regex(HORA_24H, { error: `Indicá la hora de ${campo} en formato HH:MM.` });

export const shiftInputSchema = z
  .object({
    name: z
      .string({ error: "El nombre es obligatorio." })
      .trim()
      .min(2, { error: "El nombre debe tener al menos 2 caracteres." })
      .max(LARGO_MAXIMO, {
        error: `El nombre no puede exceder ${LARGO_MAXIMO} caracteres.`,
      }),
    startTime: horaSchema("inicio"),
    endTime: horaSchema("fin"),
  })
  /**
   * Única regla de coherencia posible: que el turno dure algo.
   *
   * Deliberadamente NO se exige que el fin sea posterior al inicio. Un turno
   * nocturno cruza la medianoche —en AdventureWorks, "Night" va de 23:00 a
   * 07:00— y una comparación ingenua lo rechazaría siendo válido. Lo único
   * imposible es que empiece y termine en el mismo instante.
   */
  .refine((turno) => turno.startTime !== turno.endTime, {
    error: "El turno no puede empezar y terminar a la misma hora.",
    path: ["endTime"],
  });

export type ShiftInput = z.infer<typeof shiftInputSchema>;

export const shiftIdSchema = z.coerce
  .number({ error: "Identificador inválido." })
  .int({ error: "Identificador inválido." })
  .positive({ error: "Identificador inválido." });

export const TAMANO_PAGINA = 10;

/**
 * Filtros que viajan por la URL. Usa `catch` en lugar de `default` para que
 * un `?page=abc` escrito a mano degrade a la página 1 en vez de reventar.
 */
export const shiftQuerySchema = z.object({
  q: z.string().trim().catch(""),
  page: z.coerce.number().int().min(1).catch(1),
});

export type ShiftQuery = z.infer<typeof shiftQuerySchema>;
