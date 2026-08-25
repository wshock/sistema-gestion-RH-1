import type { EmployeeAssignment, EmployeePayRecord } from "@/features/empleados/types";

/**
 * Resolución de la situación vigente de un empleado.
 *
 * Son funciones puras a propósito: no tocan la base. Reciben el historial ya
 * cargado y eligen el registro que cuenta como actual. El Sprint 3 (cambio
 * salarial y traslado) las reutiliza para no recalcular la vigencia con otra
 * regla en cada pantalla.
 */

/**
 * Salario vigente: el registro de `EmployeePayHistory` con la fecha de cambio
 * más reciente. `null` si el empleado aún no tiene historial salarial.
 */
export function currentPay(
  history: readonly EmployeePayRecord[],
): EmployeePayRecord | null {
  if (history.length === 0) {
    return null;
  }

  return history.reduce((vigente, registro) =>
    registro.rateChangeDate.getTime() > vigente.rateChangeDate.getTime()
      ? registro
      : vigente,
  );
}

/**
 * Asignación vigente: la fila de `EmployeeDepartmentHistory` sin fecha de
 * cierre. Si por un desajuste de datos hubiera más de una abierta, se queda
 * con la de `startDate` más reciente.
 */
export function currentAssignment(
  history: readonly EmployeeAssignment[],
): EmployeeAssignment | null {
  const abiertas = history.filter((asignacion) => asignacion.endDate === null);

  if (abiertas.length === 0) {
    return null;
  }

  return abiertas.reduce((vigente, registro) =>
    registro.startDate > vigente.startDate ? registro : vigente,
  );
}
