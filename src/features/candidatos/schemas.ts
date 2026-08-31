import { z } from "zod";

import {
  fechaSchema,
  idSchema,
  LARGO_CARGO,
  LARGO_DOCUMENTO,
  LARGO_NOMBRE,
  textoObligatorio,
  validarFechas,
} from "@/lib/employmentSchemas";

/**
 * Validación del módulo de candidatos: filtros del listado, el alta/edición
 * del currículum y las condiciones de contratación (HU-29), todo compartido
 * por el formulario y la Server Action correspondiente.
 */

export const TAMANO_PAGINA = 20;

// `Resume` era `nvarchar(max)`/`xml` sin límite en AdventureWorks; se acota
// para evitar que un pegado accidental de un documento entero reviente el
// campo de texto.
const LARGO_MAXIMO_CURRICULUM = 8000;

/**
 * Alta y edición de un candidato.
 *
 * `firstName`/`lastName` son campos propios de `JobCandidate` —no se
 * extraen del currículum—: un currículum es texto libre, y depender de que
 * traiga las etiquetas justas para reconstruir un nombre es exactamente el
 * problema que este esquema evita. Ver
 * `migration/add_jobcandidate_name_columns.sql`.
 */
export const candidateInputSchema = z.object({
  firstName: textoObligatorio("El nombre", LARGO_NOMBRE),
  lastName: textoObligatorio("El apellido", LARGO_NOMBRE),
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

/**
 * Condiciones de contratación (HU-29/HU-30).
 *
 * Son los campos que `JobCandidate` sigue sin tener aunque ya tenga nombre y
 * apellido propios: documento, cargo, fechas, departamento, turno y salario
 * no existen en su registro hasta que se completan acá. La ejecución de la
 * contratación —crear `Person`/`Employee` (con el nombre que ya trae el
 * candidato), la asignación y el salario iniciales, y vincular
 * `JobCandidate.businessEntityId`— la hace `services/hire.service.ts`; este
 * esquema solo valida el formulario.
 */
export const hireCandidateSchema = z
  .object({
    nationalIdNumber: textoObligatorio("El documento", LARGO_DOCUMENTO),
    jobTitle: textoObligatorio("El cargo", LARGO_CARGO),
    birthDate: fechaSchema("nacimiento"),
    maritalStatus: z.enum(["S", "M"], { error: "Seleccioná el estado civil." }),
    gender: z.enum(["M", "F"], { error: "Seleccioná el género." }),
    hireDate: fechaSchema("contratación"),
    departmentId: idSchema("el departamento"),
    shiftId: idSchema("el turno"),
    rate: z.coerce
      .number({ error: "El salario es obligatorio." })
      .positive({ error: "El salario debe ser mayor que cero." })
      // `numeric` sin escala en la base; se acota para evitar importes absurdos.
      .max(1_000_000, { error: "El salario supera el máximo admitido." }),
    payFrequency: z.coerce
      .number({ error: "Seleccioná la frecuencia de pago." })
      .refine((valor): valor is 1 | 2 => valor === 1 || valor === 2, {
        error: "La frecuencia de pago debe ser mensual o quincenal.",
      }),
  })
  .superRefine(validarFechas);

export type HireCandidateInput = z.infer<typeof hireCandidateSchema>;
