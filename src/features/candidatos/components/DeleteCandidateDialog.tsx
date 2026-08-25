"use client";

import { toast } from "sonner";

import { deleteCandidateAction } from "@/features/candidatos/actions/candidate";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

export function DeleteCandidateDialog({
  jobCandidateId,
  nombre,
  trigger,
  onEliminado,
}: {
  jobCandidateId: number;
  /** Para nombrar al candidato en la confirmación; cae al id si no hay nombre. */
  nombre: string;
  trigger: React.ReactElement;
  /** Se ejecuta tras un borrado exitoso, p. ej. para volver al listado desde la ficha. */
  onEliminado?: () => void;
}) {
  return (
    <ConfirmDialog
      trigger={trigger}
      titulo="Eliminar candidato"
      descripcion={
        <>
          ¿Seguro que querés eliminar a{" "}
          <span className="text-foreground font-medium">{nombre}</span>? Esta acción no se
          puede deshacer.
        </>
      }
      textoConfirmar="Eliminar"
      onConfirmar={async () => {
        const resultado = await deleteCandidateAction(jobCandidateId);

        if (resultado.success) {
          toast.success(`Se eliminó a "${nombre}".`);
          onEliminado?.();

          return true;
        }

        // Aquí aparece la regla de negocio: si el candidato ya fue contratado,
        // el servicio lo explica en lugar de dejar salir un error de clave
        // foránea. El diálogo sigue abierto para que el mensaje no se pierda
        // junto con el contexto de qué se intentaba borrar.
        toast.error(resultado.error.message);

        return false;
      }}
    />
  );
}
