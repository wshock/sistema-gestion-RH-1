import Link from "next/link";
import { EyeIcon, PencilIcon, Trash2Icon, UserCheckIcon } from "lucide-react";

import { EmployeeStatusAction } from "@/features/empleados/components/EmployeeStatusAction";
import { Button } from "@/components/ui/button";
import type { EmployeeListItem } from "@/features/empleados/types";

/**
 * Acciones de cada fila del listado: ver ficha, editar y dar de baja o
 * reactivar. Solo íconos —a diferencia de `EmployeeDetailActions`, que tiene
 * el espacio y el contexto para llevar rótulo—.
 *
 * "Eliminar" es, para empleados, dar de baja: acá no hay borrado físico (ver
 * HU-28 y `docs/acuerdo-empleados.md`), así que el tacho dispara la misma
 * confirmación que la ficha, solo que como ícono.
 */
export function EmployeeRowActions({ empleado }: { empleado: EmployeeListItem }) {
  const nombre = `${empleado.lastName}, ${empleado.firstName}`;

  return (
    <div className="flex justify-end gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Ver ficha de ${nombre}`}
        render={<Link href={`/empleados/${empleado.businessEntityId}`} />}
      >
        <EyeIcon />
      </Button>

      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Editar ${nombre}`}
        render={<Link href={`/empleados/${empleado.businessEntityId}/editar`} />}
      >
        <PencilIcon />
      </Button>

      <EmployeeStatusAction
        businessEntityId={empleado.businessEntityId}
        nombre={nombre}
        currentFlag={empleado.currentFlag}
        trigger={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={
              empleado.currentFlag ? `Dar de baja a ${nombre}` : `Reactivar a ${nombre}`
            }
          >
            {empleado.currentFlag ? <Trash2Icon /> : <UserCheckIcon />}
          </Button>
        }
      />
    </div>
  );
}
