"use client";

import { toast } from "sonner";
import { UserCheckIcon, UserXIcon } from "lucide-react";

import { setEmployeeStatusAction } from "@/features/empleados/actions/employee";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";

/**
 * Baja lógica y reactivación, usable desde la ficha (botón con rótulo) o
 * desde la fila del listado (ícono, vía `trigger`).
 *
 * Un solo componente para las dos direcciones: el texto de confirmación y la
 * acción a llamar dependen todos de `currentFlag`, así que separarlos en dos
 * componentes solo duplicaría la lógica.
 */
export function EmployeeStatusAction({
  businessEntityId,
  nombre,
  currentFlag,
  trigger,
}: {
  businessEntityId: number;
  nombre: string;
  currentFlag: boolean;
  /** Disparador del diálogo. Por defecto, el botón con rótulo de la ficha. */
  trigger?: React.ReactElement;
}) {
  return (
    <ConfirmDialog
      trigger={
        trigger ?? (
          <Button variant="outline" size="sm">
            {currentFlag ? <UserXIcon /> : <UserCheckIcon />}
            {currentFlag ? "Dar de baja" : "Reactivar"}
          </Button>
        )
      }
      titulo={currentFlag ? "Dar de baja al empleado" : "Reactivar empleado"}
      descripcion={
        currentFlag ? (
          <>
            ¿Seguro que querés dar de baja a{" "}
            <span className="text-foreground font-medium">{nombre}</span>? Su información
            y sus historiales se conservan íntegros, y podés reactivarlo cuando haga
            falta.
          </>
        ) : (
          <>
            ¿Reactivar a <span className="text-foreground font-medium">{nombre}</span>?
            Volverá a figurar como empleado activo.
          </>
        )
      }
      variante={currentFlag ? "destructive" : "default"}
      textoConfirmar={currentFlag ? "Dar de baja" : "Reactivar"}
      onConfirmar={async () => {
        const resultado = await setEmployeeStatusAction(businessEntityId, !currentFlag);

        if (resultado.success) {
          toast.success(
            currentFlag ? `Se dio de baja a "${nombre}".` : `Se reactivó a "${nombre}".`,
          );

          return true;
        }

        toast.error(resultado.error.message);

        return false;
      }}
    />
  );
}
