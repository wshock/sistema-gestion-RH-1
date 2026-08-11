"use client";

import { toast } from "sonner";

import { deleteDepartmentAction } from "@/actions/department";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

export function DeleteDepartmentDialog({
  departmentId,
  name,
  trigger,
}: {
  departmentId: number;
  name: string;
  trigger: React.ReactElement;
}) {
  return (
    <ConfirmDialog
      trigger={trigger}
      titulo="Eliminar departamento"
      descripcion={
        <>
          ¿Seguro que querés eliminar{" "}
          <span className="text-foreground font-medium">{name}</span>? Esta acción no se
          puede deshacer.
        </>
      }
      textoConfirmar="Eliminar"
      onConfirmar={async () => {
        const resultado = await deleteDepartmentAction(departmentId);

        if (resultado.success) {
          toast.success(`Se eliminó "${name}".`);

          return true;
        }

        // Aquí aparece la regla de negocio: si el departamento tiene historial
        // de empleados, el servicio lo explica en lugar de dejar salir el error
        // de clave foránea. El diálogo sigue abierto para que el mensaje no se
        // pierda junto con el contexto de qué se intentaba borrar.
        toast.error(resultado.error.message);

        return false;
      }}
    />
  );
}
