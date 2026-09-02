import { z } from "zod";

/**
 * Validación de campos de dominio laboral, compartida por `empleados` (alta y
 * edición) y `candidatos` (alta y contratación): nombre, documento, cargo,
 * fechas de nacimiento/contratación y su coherencia entre sí, y selects de
 * catálogo.
 *
 * Vive acá y no en ninguno de los dos módulos porque "un módulo no importa de
 * otro" (ver `features/README.md`), y las dos features declaran exactamente
 * las mismas reglas para los mismos campos —duplicarlas las dejaría libres
 * de divergir con el tiempo—.
 */

// Largos de AdventureWorks. Las columnas quedaron como `text` en PostgreSQL,
// pero se respetan para no divergir del modelo original.
export const LARGO_DOCUMENTO = 15;
export const LARGO_CARGO = 50;
export const LARGO_NOMBRE = 50;

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
 * `Date` arrastraría zona horaria y desplazaría el día.
 */
export const fechaSchema = (campo: string) =>
  z
    .string({ error: `La fecha de ${campo} es obligatoria.` })
    .trim()
    .min(1, { error: `La fecha de ${campo} es obligatoria.` })
    .regex(FECHA_ISO, { error: `Indicá la fecha de ${campo} como AAAA-MM-DD.` })
    .refine(esFechaReal, { error: `Esa fecha de ${campo} no existe en el calendario.` });

export const textoObligatorio = (campo: string, largoMaximo: number) =>
  z
    .string({ error: `${campo} es obligatorio.` })
    .trim()
    .min(1, { error: `${campo} es obligatorio.` })
    .max(largoMaximo, { error: `${campo} no puede exceder ${largoMaximo} caracteres.` });

export const idSchema = (campo: string) =>
  z.coerce
    .number({ error: `Seleccioná ${campo}.` })
    .int({ error: `Seleccioná ${campo}.` })
    .positive({ error: `Seleccioná ${campo}.` });

/** Fecha `"AAAA-MM-DD"` a milisegundos UTC, para comparar sin depender del huso. */
export function fechaATiempo(fecha: string): number {
  const [anio, mes, dia] = fecha.split("-").map(Number);

  return Date.UTC(anio, mes - 1, dia);
}

/**
 * Coherencia entre fecha de nacimiento y de contratación.
 *
 * Va como comprobación cruzada y no dentro de cada campo porque necesita ver
 * los dos a la vez. Sin esto nada impediría contratar a alguien antes de que
 * naciera: la base ya no trae los `CHECK` originales de AdventureWorks.
 */
export function validarFechas(
  datos: { birthDate: string; hireDate: string },
  ctx: z.RefinementCtx,
) {
  const [anio, mes, dia] = datos.birthDate.split("-").map(Number);
  const nacimiento = fechaATiempo(datos.birthDate);
  const contratacion = fechaATiempo(datos.hireDate);
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
      message: `Debe tener al menos ${EDAD_MINIMA} años en la fecha de contratación.`,
    });
  }
}
