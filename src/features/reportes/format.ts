/**
 * Formato de importes y fechas de los reportes.
 *
 * Las tarifas de AdventureWorks están en dólares por hora. Las fechas de
 * calendario (`hireDate`) viajan como `"AAAA-MM-DD"` y se pintan en UTC para
 * no correr el día según el huso del servidor.
 */

const formatoSalario = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const formatoFecha = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function formatPayRate(rate: number): string {
  return formatoSalario.format(rate);
}

/** Fecha de calendario `"AAAA-MM-DD"` → texto legible. */
export function formatCalendarDate(iso: string): string {
  const [anio, mes, dia] = iso.split("-").map(Number);

  return formatoFecha.format(new Date(Date.UTC(anio, mes - 1, dia)));
}

/** Años de antigüedad → etiqueta en español. */
export function formatYearsOfService(years: number): string {
  return years === 1 ? "1 año" : `${years} años`;
}

const formatoPorcentaje = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** `12.345` → `"12,3 %"`. */
export function formatPercentage(value: number): string {
  return `${formatoPorcentaje.format(value)} %`;
}

/** `"23:00"`, `"07:00"` → `"23:00 – 07:00 (+1 día)"`. */
export function formatShiftSchedule(
  startTime: string,
  endTime: string,
  crossesMidnight: boolean,
): string {
  const rango = `${startTime} – ${endTime}`;

  return crossesMidnight ? `${rango} (+1 día)` : rango;
}
