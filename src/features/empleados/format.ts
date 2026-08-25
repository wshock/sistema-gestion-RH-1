import type { PayFrequency } from "@/features/empleados/types";

/**
 * Formato de fechas e importes de la ficha.
 *
 * Las columnas `date` viajan como `"AAAA-MM-DD"` y los `timestamptz` como
 * `Date`. Ambos se pintan en UTC para no correr el día en Bogotá. El salario
 * de AdventureWorks está en dólares por hora.
 */

const formatoFecha = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const formatoSalario = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export const PAY_FREQUENCY_LABEL: Record<PayFrequency, string> = {
  1: "Mensual",
  2: "Quincenal",
};

/** Fecha de calendario `"AAAA-MM-DD"` → texto, sin correr el día por el huso. */
export function formatCalendarDate(iso: string): string {
  const [anio, mes, dia] = iso.split("-").map(Number);

  return formatoFecha.format(new Date(Date.UTC(anio, mes - 1, dia)));
}

/** Instante (`timestamptz`) → misma fecha de calendario, en UTC. */
export function formatInstantDate(fecha: Date): string {
  return formatoFecha.format(fecha);
}

export function formatPayRate(rate: number): string {
  return formatoSalario.format(rate);
}
