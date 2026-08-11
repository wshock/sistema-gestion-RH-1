/**
 * Mensajes de bloqueo por integridad referencial.
 *
 * Departamentos y turnos comparten exactamente la misma regla —no se borra
 * nada que figure en el historial de un empleado— y por tanto deben explicarla
 * con las mismas palabras. Tenerla acá evita que los dos catálogos se
 * desvíen, y que un módulo futuro invente una tercera redacción.
 */

/**
 * Asignaciones que apuntan a un departamento o turno.
 *
 * Se cuentan por separado porque el motivo del bloqueo no es el mismo: las
 * vigentes son personal trabajando hoy, las históricas son la trayectoria de
 * quienes pasaron por ahí. Ambas impiden el borrado, pero al administrador le
 * cambia el panorama saber cuál pesa.
 */
export type ConteoAsignaciones = {
  /** Asignaciones abiertas: el empleado sigue en ese departamento o turno. */
  vigentes: number;
  /** Asignaciones cerradas: constan en el historial del empleado. */
  historicas: number;
};

export function totalAsignaciones({ vigentes, historicas }: ConteoAsignaciones): number {
  return vigentes + historicas;
}

function enPlural(cantidad: number, singular: string, plural: string): string {
  return `${cantidad} ${cantidad === 1 ? singular : plural}`;
}

/**
 * Explica por qué no se puede borrar y cuántos registros lo impiden.
 *
 * Menciona solo los grupos con registros: un turno con 52 asignaciones
 * vigentes y ningún histórico no debe hablar de "0 registros históricos".
 */
export function mensajeDeBloqueo(
  entidad: "departamento" | "turno",
  nombre: string,
  conteo: ConteoAsignaciones,
): string {
  const partes: string[] = [];

  if (conteo.vigentes > 0) {
    partes.push(enPlural(conteo.vigentes, "asignación vigente", "asignaciones vigentes"));
  }

  if (conteo.historicas > 0) {
    partes.push(
      enPlural(conteo.historicas, "registro histórico", "registros históricos"),
    );
  }

  return (
    `No se puede eliminar el ${entidad} "${nombre}": ` +
    `tiene ${partes.join(" y ")} de empleados.`
  );
}
