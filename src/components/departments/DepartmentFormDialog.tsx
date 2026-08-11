"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createDepartmentAction, updateDepartmentAction } from "@/actions/department";
import { FormDialog } from "@/components/shared/FormDialog";
import { FormField } from "@/components/shared/FormField";
import { Input } from "@/components/ui/input";
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

  const valoresIniciales = {
    name: departamento?.name ?? "",
    groupName: departamento?.groupName ?? "",
  };

  const form = useForm<DepartmentInput>({
    resolver: zodResolver(departmentInputSchema),
    defaultValues: valoresIniciales,
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
      form.reset(esEdicion ? valores : valoresIniciales);

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
    <FormDialog
      abierto={abierto}
      onAbiertoChange={(nuevoEstado) => {
        setAbierto(nuevoEstado);

        // Al cerrar se descarta lo tecleado: la próxima apertura debe partir
        // de los datos reales, no de una edición a medias.
        if (!nuevoEstado) {
          form.reset(valoresIniciales);
        }
      }}
      trigger={trigger}
      titulo={esEdicion ? "Editar departamento" : "Nuevo departamento"}
      descripcion={
        esEdicion
          ? "Modificá los datos del departamento."
          : "Completá los datos para registrar un departamento."
      }
      textoEnviar={esEdicion ? "Guardar cambios" : "Crear departamento"}
      enviando={isSubmitting}
      onSubmit={form.handleSubmit(alEnviar)}
    >
      <FormField id="name" label="Nombre" error={errors.name?.message}>
        {(props) => <Input autoFocus {...props} {...form.register("name")} />}
      </FormField>

      <FormField id="groupName" label="Grupo" error={errors.groupName?.message}>
        {(props) => <Input {...props} {...form.register("groupName")} />}
      </FormField>
    </FormDialog>
  );
}
