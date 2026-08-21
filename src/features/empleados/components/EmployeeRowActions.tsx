import type { EmployeeListItem } from "@/features/empleados/types";

/**
 * Punto de montaje: acciones de cada fila del listado (editar y baja lógica).
 *
 * ⚠️ Marcador de posición. Lo implementa la feature de escritura (HU-23);
 * hasta entonces devuelve `null` y la columna de acciones queda vacía.
 *
 * Recibe la fila completa —no solo el id— para poder precargar el formulario
 * de edición y rotular la confirmación de baja con el nombre del empleado,
 * sin volver a consultar.
 *
 * Ver `docs/acuerdo-empleados.md`.
 */
export function EmployeeRowActions({ empleado }: { empleado: EmployeeListItem }) {
  void empleado;

  return null;
}
