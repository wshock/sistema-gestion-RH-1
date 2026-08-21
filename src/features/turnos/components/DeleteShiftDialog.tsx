"use client";

import { toast } from "sonner";

import { deleteShiftAction } from "@/features/turnos/actions/shift";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

export function DeleteShiftDialog({
  shiftId,
  name,
  trigger,
}: {
  shiftId: number;
  name: string;
  trigger: React.ReactElement;
}) {
  return (
    <ConfirmDialog
      trigger={trigger}
      titulo="Eliminar turno"
      descripcion={
        <>
          ¿Seguro que querés eliminar{" "}
          <span className="text-foreground font-medium">{name}</span>? Esta acción no se
          puede deshacer.
        </>
      }
      textoConfirmar="Eliminar"
      onConfirmar={async () => {
        const resultado = await deleteShiftAction(shiftId);

        if (resultado.success) {
          toast.success(`Se eliminó "${name}".`);

          return true;
        }

        // Aquí aparece la regla de negocio: si el turno tiene historial de
        // empleados asignados, el servicio lo explica en lugar de dejar salir
        // el error de clave foránea. El diálogo sigue abierto para que el
        // mensaje no se pierda junto con el contexto de qué se intentaba borrar.
        toast.error(resultado.error.message);

        return false;
      }}
    />
  );
}
