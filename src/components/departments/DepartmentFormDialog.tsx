"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircleIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createDepartmentAction, updateDepartmentAction } from "@/actions/department";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { departmentInputSchema, type DepartmentInput } from "@/schemas/department.schema";

type Departamento = { departmentId: number; name: string; groupName: string };

/**
 * Formulario de alta y edición.
 *
 * Valida en el cliente con el mismo esquema de Zod que usa la Server Action.
 * La validación de acá es comodidad: da feedback sin viaje al servidor, pero
 * la que decide es la del servidor, porque esta se puede saltar.
 */
export function DepartmentFormDialog({
  departamento,
  trigger,
}: {
  departamento?: Departamento;
  trigger: React.ReactElement;
}) {
  const [abierto, setAbierto] = useState(false);
  const esEdicion = departamento !== undefined;

  const form = useForm<DepartmentInput>({
    resolver: zodResolver(departmentInputSchema),
    defaultValues: {
      name: departamento?.name ?? "",
      groupName: departamento?.groupName ?? "",
    },
  });

  const {
    formState: { errors, isSubmitting },
  } = form;

  async function alEnviar(valores: DepartmentInput) {
    const resultado = esEdicion
      ? await updateDepartmentAction(departamento.departmentId, valores)
      : await createDepartmentAction(valores);

    if (resultado.success) {
      toast.success(esEdicion ? "Departamento actualizado." : "Departamento creado.");
      setAbierto(false);
      form.reset(esEdicion ? valores : { name: "", groupName: "" });

      return;
    }

    // Los errores por campo se pintan junto al input que los provocó; el resto
    // llega como aviso general.
    const { error } = resultado;

    if (error.fieldErrors) {
      for (const [campo, mensajes] of Object.entries(error.fieldErrors)) {
        if (campo === "name" || campo === "groupName") {
          form.setError(campo, { message: mensajes[0] });
        }
      }
    }

    toast.error(error.message);
  }

  return (
    <Dialog
      open={abierto}
      onOpenChange={(nuevoEstado) => {
        setAbierto(nuevoEstado);

        if (!nuevoEstado) {
          form.reset({
            name: departamento?.name ?? "",
            groupName: departamento?.groupName ?? "",
          });
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {esEdicion ? "Editar departamento" : "Nuevo departamento"}
          </DialogTitle>
          <DialogDescription>
            {esEdicion
              ? "Modificá los datos del departamento."
              : "Completá los datos para registrar un departamento."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(alEnviar)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              autoFocus
              aria-invalid={Boolean(errors.name)}
              {...form.register("name")}
            />
            {errors.name && (
              <p className="text-destructive text-xs">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="groupName">Grupo</Label>
            <Input
              id="groupName"
              aria-invalid={Boolean(errors.groupName)}
              {...form.register("groupName")}
            />
            {errors.groupName && (
              <p className="text-destructive text-xs">{errors.groupName.message}</p>
            )}
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancelar
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <LoaderCircleIcon className="animate-spin" />}
              {esEdicion ? "Guardar cambios" : "Crear departamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
