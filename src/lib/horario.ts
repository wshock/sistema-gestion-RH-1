/**
 * Utilidades para presentar horarios de turnos.
 *
 * Trabajan sobre texto `HH:MM` en 24 h, que es como circulan las horas de la
 * capa de datos hacia arriba (ver `src/data/shift.ts`). Son funciones puras:
 * no tocan `Date` ni, por tanto, la zona horaria de quien las ejecute.
 */

const MINUTOS_POR_DIA = 24 * 60;

/** `"07:30"` → 450. */
function aMinutos(hora: string): number {
  const [horas, minutos] = hora.split(":").map(Number);

  return horas * 60 + minutos;
}

/**
 * Un turno cruza la medianoche cuando termina antes —o a la misma hora— de la
 * que empieza. "Night" en AdventureWorks va de 23:00 a 07:00.
 */
export function cruzaMedianoche(inicio: string, fin: string): boolean {
  return aMinutos(fin) <= aMinutos(inicio);
}

/**
 * Duración en minutos. Si el turno cruza la medianoche se le suma un día, que
 * es lo que hace que 23:00–07:00 dure 8 h y no −16.
 */
export function duracionEnMinutos(inicio: string, fin: string): number {
  const diferencia = aMinutos(fin) - aMinutos(inicio);

  return diferencia > 0 ? diferencia : diferencia + MINUTOS_POR_DIA;
}

/** `510` → `"8 h 30 min"`. */
export function formatearDuracion(minutos: number): string {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;

  if (horas === 0) {
    return `${resto} min`;
  }

  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
}

/** Duración de un turno ya formateada, p. ej. `"8 h"`. */
export function formatearDuracionDeTurno(inicio: string, fin: string): string {
  return formatearDuracion(duracionEnMinutos(inicio, fin));
}
