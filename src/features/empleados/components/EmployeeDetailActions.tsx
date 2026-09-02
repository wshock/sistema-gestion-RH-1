import Link from "next/link";
import { CircleDollarSignIcon, PencilIcon } from "lucide-react";

import { EmployeeStatusAction } from "@/features/empleados/components/EmployeeStatusAction";
import { Button } from "@/components/ui/button";
import type { EmployeeDetail } from "@/features/empleados/types";

/**
 * Acciones de la ficha de detalle: editar (HU-27), baja/reactivación
 * lógica (HU-28) y cambio salarial (HU-34). Separado de `EmployeeRowActions`
 * porque la ficha dispone de todos los datos y de más espacio: acá los
 * botones llevan rótulo, en la fila son solo iconos.
 *
 * Ver `docs/acuerdo-empleados.md`.
 */
export function EmployeeDetailActions({ empleado }: { empleado: EmployeeDetail }) {
  const nombre = `${empleado.lastName}, ${empleado.firstName}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        render={<Link href={`/empleados/${empleado.businessEntityId}/editar`} />}
      >
        <PencilIcon />
        Editar
      </Button>

      <Button
        variant="outline"
        size="sm"
        render={<Link href={`/empleados/${empleado.businessEntityId}/salario`} />}
      >
        <CircleDollarSignIcon />
        Cambio salarial
      </Button>

      <EmployeeStatusAction
        businessEntityId={empleado.businessEntityId}
        nombre={nombre}
        currentFlag={empleado.currentFlag}
      />
    </div>
  );
}
