"use client";

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
 * Diálogo modal para formularios.
 *
 * Aporta el armazón que se repite en toda alta y edición —cabecera, `<form>`,
 * pie con cancelar y enviar, botón bloqueado mientras se envía— y deja los
 * campos y la validación a quien lo usa. No conoce ninguna entidad: los
 * campos entran como `children`.
 *
 * La apertura la controla el consumidor porque es él quien sabe cuándo la
 * operación terminó bien y toca cerrar.
 */
export function FormDialog({
  abierto,
  onAbiertoChange,
  trigger,
  titulo,
  descripcion,
  textoEnviar = "Guardar",
  textoCancelar = "Cancelar",
  enviando = false,
  onSubmit,
  children,
}: {
  abierto: boolean;
  onAbiertoChange: (abierto: boolean) => void;
  trigger: React.ReactElement;
  titulo: string;
  descripcion?: React.ReactNode;
  textoEnviar?: string;
  textoCancelar?: string;
  enviando?: boolean;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  children: React.ReactNode;
}) {
  return (
    <Dialog
      open={abierto}
      // Cerrar a mitad de un envío dejaría la operación huérfana y sin forma de
      // avisar del resultado.
      onOpenChange={(nuevoEstado) => {
        if (!enviando) {
          onAbiertoChange(nuevoEstado);
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          {descripcion && <DialogDescription>{descripcion}</DialogDescription>}
        </DialogHeader>

        {/* `noValidate` deja la validación en manos de Zod: los mensajes del
            navegador no se pueden traducir ni dar estilo. */}
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {children}

          <DialogFooter>
            <DialogClose
              render={<Button type="button" variant="outline" disabled={enviando} />}
            >
              {textoCancelar}
            </DialogClose>
            <Button type="submit" disabled={enviando}>
              {enviando && <LoaderCircleIcon className="animate-spin" />}
              {textoEnviar}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
