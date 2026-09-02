import { z } from "zod";

/**
 * Validación del módulo de empleados, compartida por la feature de lectura
 * (filtros del listado) y la de escritura (formularios y Server Actions).
 *
 * Este archivo es contrato entre ambas: se modifica de común acuerdo, no
 * dentro de una rama de feature. Ver `docs/acuerdo-empleados.md`.
 *
 * Importante: de AdventureWorks solo se migraron claves primarias y foráneas
 * —ninguna restricción `UNIQUE` ni `CHECK`—, así que la base aceptaría un
 * empleado nacido en 3025 o dos con el mismo documento. Todo lo que aquí se
 * declara es, en la práctica, la única barrera que existe.
 */

// Largos de AdventureWorks. Las columnas quedaron como `text` en PostgreSQL,
// pero se respetan para no divergir del modelo original.
const LARGO = {
  nombre: 50,
  titulo: 8,
  sufijo: 10,
  documento: 15,
  usuario: 256,
  cargo: 50,
} as const;

/** Edad mínima admitida en la fecha de contratación. */
const EDAD_MINIMA = 18;

const FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Descarta fechas con forma válida pero inexistentes, como `2026-02-31`. */
function esFechaReal(texto: string): boolean {
  const [anio, mes, dia] = texto.split("-").map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));

  return (
    fecha.getUTCFullYear() === anio &&
    fecha.getUTCMonth() === mes - 1 &&
    fecha.getUTCDate() === dia
  );
}

/**
 * Fecha sin hora, como texto `"AAAA-MM-DD"`.
 *
 * Es lo que produce `<input type="date">` y lo que circula por el sistema: un
 * `Date` arrastraría zona horaria y desplazaría el día (ver
 * `src/types/employee.ts`).
 */
const fechaSchema = (campo: string) =>
  z
    .string({ error: `La fecha de ${campo} es obligatoria.` })
    .trim()
    .min(1, { error: `La fecha de ${campo} es obligatoria.` })
    .regex(FECHA_ISO, { error: `Indicá la fecha de ${campo} como AAAA-MM-DD.` })
    .refine(esFechaReal, { error: `Esa fecha de ${campo} no existe en el calendario.` });

const textoObligatorio = (campo: string, largoMaximo: number) =>
  z
    .string({ error: `${campo} es obligatorio.` })
    .trim()
    .min(1, { error: `${campo} es obligatorio.` })
    .max(largoMaximo, { error: `${campo} no puede exceder ${largoMaximo} caracteres.` });

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

const idSchema = (campo: string) =>
  z.coerce
    .number({ error: `Seleccioná ${campo}.` })
    .int({ error: `Seleccioná ${campo}.` })
    .positive({ error: `Seleccioná ${campo}.` });

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
 * Campos que comparten el alta y la edición.
 *
 * Se declara como objeto plano —no como esquema— para poder construir ambos
 * esquemas a partir de él sin que uno herede las validaciones cruzadas del
 * otro.
 */
const camposDeEmpleado = {
  // Persona
  title: textoOpcional("El tratamiento", LARGO.titulo),
  firstName: textoObligatorio("El nombre", LARGO.nombre),
  middleName: textoOpcional("El segundo nombre", LARGO.nombre),
  lastName: textoObligatorio("El apellido", LARGO.nombre),
  suffix: textoOpcional("El sufijo", LARGO.sufijo),

  // Empleado
  nationalIdNumber: textoObligatorio("El documento", LARGO.documento),
  loginId: textoObligatorio("El usuario de red", LARGO.usuario),
  jobTitle: textoObligatorio("El cargo", LARGO.cargo),
  birthDate: fechaSchema("nacimiento"),
  maritalStatus: z.enum(["S", "M"], { error: "Seleccioná el estado civil." }),
  gender: z.enum(["M", "F"], { error: "Seleccioná el género." }),
  hireDate: fechaSchema("contratación"),
  salariedFlag: z.coerce.boolean(),
  vacationHours: horasSchema("Las horas de vacaciones"),
  sickLeaveHours: horasSchema("Las horas de incapacidad"),
};

/** Fecha `"AAAA-MM-DD"` a milisegundos UTC, para comparar sin depender del huso. */
function aTiempo(fecha: string): number {
  const [anio, mes, dia] = fecha.split("-").map(Number);

  return Date.UTC(anio, mes - 1, dia);
}

/**
 * Coherencia entre fechas.
 *
 * Va como comprobación cruzada y no dentro de cada campo porque necesita ver
 * los dos a la vez. Sin esto nada impediría contratar a alguien antes de que
 * naciera: la base ya no trae los `CHECK` originales de AdventureWorks.
 */
function validarFechas(
  datos: { birthDate: string; hireDate: string },
  ctx: z.RefinementCtx,
) {
  const [anio, mes, dia] = datos.birthDate.split("-").map(Number);
  const nacimiento = aTiempo(datos.birthDate);
  const contratacion = aTiempo(datos.hireDate);
  const mayoriaDeEdad = Date.UTC(anio + EDAD_MINIMA, mes - 1, dia);

  if (contratacion > Date.now()) {
    ctx.addIssue({
      code: "custom",
      path: ["hireDate"],
      message: "La fecha de contratación no puede ser futura.",
    });
  }

  if (contratacion < nacimiento) {
    ctx.addIssue({
      code: "custom",
      path: ["birthDate"],
      message: "La fecha de nacimiento es posterior a la de contratación.",
    });

    return;
  }

  if (contratacion < mayoriaDeEdad) {
    ctx.addIssue({
      code: "custom",
      path: ["birthDate"],
      message: `El empleado debe tener al menos ${EDAD_MINIMA} años en la fecha de contratación.`,
    });
  }
}

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

/**
 * Cambio salarial: tarifa, frecuencia y fecha. No toca registros anteriores;
 * el servicio inserta una fila nueva. La fecha no puede ser futura; que sea
 * posterior al vigente lo resuelve el servicio con `currentPay`.
 */
export const salaryChangeSchema = z
  .object({
    businessEntityId: employeeIdSchema,
    rate: rateSchema,
    payFrequency: payFrequencySchema,
    rateChangeDate: fechaSchema("cambio"),
  })
  .superRefine((datos, ctx) => {
    if (aTiempo(datos.rateChangeDate) > Date.now()) {
      ctx.addIssue({
        code: "custom",
        path: ["rateChangeDate"],
        message: "La fecha de cambio no puede ser futura.",
      });
    }
  });

export type SalaryChangeInput = z.infer<typeof salaryChangeSchema>;

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
