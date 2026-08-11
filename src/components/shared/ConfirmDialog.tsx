"use client";

import { useState, useTransition } from "react";
import { LoaderCircleIcon } from "lucide-react";

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

/**
 * Confirmación para acciones que no se pueden deshacer.
 *
 * Genérico: no sabe qué se está borrando ni cómo. Recibe el texto a mostrar y
 * la operación a ejecutar, y se encarga del resto —bloquear el botón mientras
 * corre y cerrarse solo si salió bien—, que es lo que se repite en cada módulo.
 */
export function ConfirmDialog({
  trigger,
  titulo,
  descripcion,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  variante = "destructive",
  onConfirmar,
}: {
  trigger: React.ReactElement;
  titulo: string;
  descripcion: React.ReactNode;
  textoConfirmar?: string;
  textoCancelar?: string;
  variante?: "destructive" | "default";
  /**
   * Operación a confirmar. Devolver `false` mantiene el diálogo abierto —el
   * caso de un fallo que el usuario debe poder reintentar—; cualquier otro
   * valor lo cierra.
   */
  onConfirmar: () => Promise<boolean | void> | boolean | void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [enProceso, iniciarProceso] = useTransition();

  function confirmar() {
    iniciarProceso(async () => {
      if ((await onConfirmar()) !== false) {
        setAbierto(false);
      }
    });
  }

  return (
    <Dialog
      open={abierto}
      // Mientras la operación está en vuelo el diálogo no se cierra: evita que
      // un Escape deje al usuario sin saber si el borrado llegó a ejecutarse.
      onOpenChange={(nuevoEstado) => {
        if (!enProceso) {
          setAbierto(nuevoEstado);
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{descripcion}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose
            render={<Button type="button" variant="outline" disabled={enProceso} />}
          >
            {textoCancelar}
          </DialogClose>
          <Button variant={variante} onClick={confirmar} disabled={enProceso}>
            {enProceso && <LoaderCircleIcon className="animate-spin" />}
            {textoConfirmar}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
