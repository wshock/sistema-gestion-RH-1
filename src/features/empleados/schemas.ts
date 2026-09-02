import { z } from "zod";

import {
  fechaATiempo,
  fechaSchema,
  idSchema,
  LARGO_CARGO,
  LARGO_DOCUMENTO,
  LARGO_NOMBRE,
  textoObligatorio,
  validarFechas,
} from "@/lib/employmentSchemas";

/**
 * Validación del módulo de empleados, compartida por la feature de lectura
 * (filtros del listado) y la de escritura (formularios y Server Actions).
 *
 * Este archivo es contrato entre ambas: se modifica de común acuerdo, no
 * dentro de una rama de feature. Ver `docs/acuerdo-empleados.md`.
 *
 * Documento, cargo y fechas se validan con `src/lib/employmentSchemas.ts`:
 * `candidatos` declara exactamente las mismas reglas para contratar (HU-29),
 * y duplicarlas las dejaría libres de divergir con el tiempo.
 *
 * Importante: de AdventureWorks solo se migraron claves primarias y foráneas
 * —ninguna restricción `UNIQUE` ni `CHECK`—, así que la base aceptaría un
 * empleado nacido en 3025 o dos con el mismo documento. Todo lo que aquí se
 * declara es, en la práctica, la única barrera que existe.
 */

// Largos de AdventureWorks. Las columnas quedaron como `text` en PostgreSQL,
// pero se respetan para no divergir del modelo original.
const LARGO = {
  titulo: 8,
  sufijo: 10,
  usuario: 256,
} as const;

/** Campo opcional: la cadena vacía del formulario se guarda como `null`. */
const textoOpcional = (campo: string, largoMaximo: number) =>
  z
    .string()
    .trim()
    .max(largoMaximo, { error: `${campo} no puede exceder ${largoMaximo} caracteres.` })
    .transform((valor) => valor || null)
    .nullable();

/** `campo` llega siempre en plural ("Las horas de vacaciones"). */
const horasSchema = (campo: string) =>
  z.coerce
    .number({ error: `${campo} deben ser un número.` })
    .int({ error: `${campo} deben ser un número entero.` })
    .min(0, { error: `${campo} no pueden ser negativas.` })
    // `smallint` en la base; pasarse reventaría la escritura.
    .max(32767, { error: `${campo} superan el máximo admitido.` });

/**
 * Campos que comparten el alta y la edición.
 *
 * Se declara como objeto plano —no como esquema— para poder construir ambos
 * esquemas a partir de él sin que uno herede las validaciones cruzadas del
 * otro.
 */
const camposDeEmpleado = {
  // Persona
  title: textoOpcional("El tratamiento", LARGO.titulo),
  firstName: textoObligatorio("El nombre", LARGO_NOMBRE),
  middleName: textoOpcional("El segundo nombre", LARGO_NOMBRE),
  lastName: textoObligatorio("El apellido", LARGO_NOMBRE),
  suffix: textoOpcional("El sufijo", LARGO.sufijo),

  // Empleado
  nationalIdNumber: textoObligatorio("El documento", LARGO_DOCUMENTO),
  loginId: textoObligatorio("El usuario de red", LARGO.usuario),
  jobTitle: textoObligatorio("El cargo", LARGO_CARGO),
  birthDate: fechaSchema("nacimiento"),
  maritalStatus: z.enum(["S", "M"], { error: "Seleccioná el estado civil." }),
  gender: z.enum(["M", "F"], { error: "Seleccioná el género." }),
  hireDate: fechaSchema("contratación"),
  salariedFlag: z.coerce.boolean(),
  vacationHours: horasSchema("Las horas de vacaciones"),
  sickLeaveHours: horasSchema("Las horas de incapacidad"),
};

/** Tarifa por hora. `numeric` sin escala en la base; se acota para evitar importes absurdos. */
const rateSchema = z.coerce
  .number({ error: "El salario es obligatorio." })
  .positive({ error: "El salario debe ser mayor que cero." })
  .max(1_000_000, { error: "El salario supera el máximo admitido." });

const payFrequencySchema = z.coerce
  .number({ error: "Seleccioná la frecuencia de pago." })
  .refine((valor): valor is 1 | 2 => valor === 1 || valor === 2, {
    error: "La frecuencia de pago debe ser mensual o quincenal.",
  });

/**
 * Edición de un empleado existente.
 *
 * No incluye departamento, turno ni salario: esos cambian por sus procesos
 * dedicados —traslado y cambio salarial— para que siempre quede historial.
 * Tampoco incluye `currentFlag`: la baja lógica es una acción aparte, no una
 * casilla del formulario.
 */
export const employeeEditSchema = z.object(camposDeEmpleado).superRefine(validarFechas);

export type EmployeeEditInput = z.infer<typeof employeeEditSchema>;

/**
 * Alta de un empleado.
 *
 * Añade la asignación y el salario iniciales, que el servicio escribe en la
 * misma transacción que la persona y el empleado. Un empleado sin
 * departamento ni salario sería un registro a medias.
 */
export const employeeCreateSchema = z
  .object({
    ...camposDeEmpleado,
    departmentId: idSchema("el departamento"),
    shiftId: idSchema("el turno"),
    rate: rateSchema,
    payFrequency: payFrequencySchema,
  })
  .superRefine(validarFechas);

export type EmployeeCreateInput = z.infer<typeof employeeCreateSchema>;

export const employeeIdSchema = z.coerce
  .number({ error: "Identificador inválido." })
  .int({ error: "Identificador inválido." })
  .positive({ error: "Identificador inválido." });

export type ContextoCambioSalarial = {
  hireDate: string;
  lastPayDate: string | null;
};

export const MENSAJE_FECHA_CAMBIO_FUTURA = "La fecha de cambio no puede ser futura.";
export const MENSAJE_FECHA_ANTES_CONTRATACION =
  "La fecha de cambio no puede ser anterior a la contratación.";
export const MENSAJE_FECHA_NO_POSTERIOR_AL_ULTIMO =
  "La fecha de cambio debe ser posterior a la del último salario registrado.";

/**
 * Coherencia cronológica del historial salarial (HU-35).
 *
 * Vive en el esquema para que cliente y servidor usen las mismas reglas y
 * los mismos textos. `lastPayDate` en `null` es el caso de un empleado sin
 * historial: el primer registro no tiene un precedente que respetar.
 */
export function validarFechaCambioSalarial(
  rateChangeDate: string,
  contexto: ContextoCambioSalarial,
  ctx: z.RefinementCtx,
) {
  if (fechaATiempo(rateChangeDate) > Date.now()) {
    ctx.addIssue({
      code: "custom",
      path: ["rateChangeDate"],
      message: MENSAJE_FECHA_CAMBIO_FUTURA,
    });
  }

  if (rateChangeDate < contexto.hireDate) {
    ctx.addIssue({
      code: "custom",
      path: ["rateChangeDate"],
      message: MENSAJE_FECHA_ANTES_CONTRATACION,
    });
  }

  if (contexto.lastPayDate && rateChangeDate <= contexto.lastPayDate) {
    ctx.addIssue({
      code: "custom",
      path: ["rateChangeDate"],
      message: MENSAJE_FECHA_NO_POSTERIOR_AL_ULTIMO,
    });
  }
}

const camposDeCambioSalarial = {
  businessEntityId: employeeIdSchema,
  rate: rateSchema,
  payFrequency: payFrequencySchema,
  rateChangeDate: fechaSchema("cambio"),
};

/** Campos del cambio, sin contexto del empleado. Sirve para parsear el payload. */
export const salaryChangeFieldsSchema = z.object(camposDeCambioSalarial);

export type SalaryChangeInput = z.infer<typeof salaryChangeFieldsSchema>;

/**
 * Esquema completo: tarifa positiva, frecuencia y fechas coherentes con la
 * contratación y el último salario. Cliente y Server Action lo comparten.
 */
export function crearSalaryChangeSchema(contexto: ContextoCambioSalarial) {
  return salaryChangeFieldsSchema.superRefine((datos, ctx) =>
    validarFechaCambioSalarial(datos.rateChangeDate, contexto, ctx),
  );
}

/** 290 empleados: con 10 por página serían 29 saltos para llegar al final. */
export const TAMANO_PAGINA = 20;

/**
 * Filtros del listado, que viajan por la URL. Usa `catch` en lugar de
 * `default` para que un `?page=abc` escrito a mano degrade en vez de reventar.
 */
export const employeeQuerySchema = z.object({
  q: z.string().trim().catch(""),
  page: z.coerce.number().int().min(1).catch(1),
  departmentId: z.coerce.number().int().positive().optional().catch(undefined),
  shiftId: z.coerce.number().int().positive().optional().catch(undefined),
  estado: z.enum(["todos", "activos", "inactivos"]).catch("todos"),
});

export type EmployeeQuery = z.infer<typeof employeeQuerySchema>;
