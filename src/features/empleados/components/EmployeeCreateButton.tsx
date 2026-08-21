/**
 * Punto de montaje: acción de alta en la cabecera del listado.
 *
 * ⚠️ Marcador de posición. Lo implementa la feature de escritura (HU-23);
 * hasta entonces devuelve `null` y el listado simplemente no muestra el botón.
 * Existe desde ya para que la feature de lectura pueda importarlo y compilar
 * sin esperar a que la otra esté lista.
 *
 * Al implementarlo: abrir `EmployeeFormDialog` en modo alta y no cambiar la
 * firma sin acordarlo, porque el listado ya lo renderiza.
 *
 * Ver `docs/acuerdo-empleados.md`.
 */
export function EmployeeCreateButton() {
  return null;
}
