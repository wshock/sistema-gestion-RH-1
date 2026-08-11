"use client";

import { useState, useTransition } from "react";
import { LoaderCircleIcon } from "lucide-react";
import { toast } from "sonner";

import { deleteDepartmentAction } from "@/actions/department";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DeleteDepartmentDialog({
  departmentId,
  name,
  trigger,
}: {
  departmentId: number;
  name: string;
  trigger: React.ReactElement;
}) {
  const [abierto, setAbierto] = useState(false);
  const [borrando, iniciarBorrado] = useTransition();

  function confirmar() {
    iniciarBorrado(async () => {
      const resultado = await deleteDepartmentAction(departmentId);

      if (resultado.success) {
        toast.success(`Se eliminó "${name}".`);
        setAbierto(false);

        return;
      }

      // Aquí aparece la regla de negocio: si el departamento tiene historial de
      // empleados, el servicio lo explica en lugar de dejar salir el error de
      // clave foránea.
      toast.error(resultado.error.message);
    });
  }

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar departamento</DialogTitle>
          <DialogDescription>
            ¿Seguro que querés eliminar{" "}
            <span className="text-foreground font-medium">{name}</span>? Esta acción no se
            puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Cancelar
          </DialogClose>
          <Button variant="destructive" onClick={confirmar} disabled={borrando}>
            {borrando && <LoaderCircleIcon className="animate-spin" />}
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
