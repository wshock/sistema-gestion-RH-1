import type { EmployeeDetail } from "@/features/empleados/types";

/**
 * Punto de montaje: acciones de la ficha de detalle (editar y baja lógica).
 *
 * ⚠️ Marcador de posición. Lo implementa la feature de escritura (HU-23);
 * hasta entonces devuelve `null` y la ficha se ve en modo solo lectura.
 *
 * Va separado de `EmployeeRowActions` porque la ficha dispone de todos los
 * datos y de más espacio: acá los botones llevan rótulo, en la fila son solo
 * iconos.
 *
 * Ver `docs/acuerdo-empleados.md`.
 */
export function EmployeeDetailActions({ empleado }: { empleado: EmployeeDetail }) {
  void empleado;

  return null;
}
