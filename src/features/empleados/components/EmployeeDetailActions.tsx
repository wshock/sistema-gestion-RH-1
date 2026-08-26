import Link from "next/link";
import { PencilIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { EmployeeDetail } from "@/features/empleados/types";

/**
 * Acciones de la ficha de detalle: editar (HU-27) y baja lógica (HU-28).
 *
 * La baja todavía no está implementada; el botón de editar va solo. Separado
 * de `EmployeeRowActions` porque la ficha dispone de todos los datos y de más
 * espacio: acá los botones llevan rótulo, en la fila son solo iconos.
 *
 * Ver `docs/acuerdo-empleados.md`.
 */
export function EmployeeDetailActions({ empleado }: { empleado: EmployeeDetail }) {
  return (
    <Button
      variant="outline"
      size="sm"
      render={<Link href={`/empleados/${empleado.businessEntityId}/editar`} />}
    >
      <PencilIcon />
      Editar
    </Button>
  );
}
