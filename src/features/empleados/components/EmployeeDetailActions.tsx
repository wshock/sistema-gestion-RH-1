import Link from "next/link";
import { CircleDollarSignIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { EmployeeDetail } from "@/features/empleados/types";

/**
 * Acciones de la ficha. El cambio salarial vive en pantalla propia; edición
 * y baja (HU-23) se montan acá cuando existan.
 */
export function EmployeeDetailActions({ empleado }: { empleado: EmployeeDetail }) {
  return (
    <Button
      variant="outline"
      render={<Link href={`/empleados/${empleado.businessEntityId}/salario`} />}
    >
      <CircleDollarSignIcon />
      Cambio salarial
    </Button>
  );
}
