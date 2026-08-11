"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { MoonStarIcon } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { createShiftAction, updateShiftAction } from "@/actions/shift";
import { FormDialog } from "@/components/shared/FormDialog";
import { FormField } from "@/components/shared/FormField";
import { Input } from "@/components/ui/input";
import { cruzaMedianoche, formatearDuracionDeTurno } from "@/lib/horario";
import { shiftInputSchema, type ShiftInput } from "@/schemas/shift.schema";

type Turno = { shiftId: number; name: string; startTime: string; endTime: string };

const CAMPOS = ["name", "startTime", "endTime"] as const;

function esCampoDeTurno(campo: string): campo is (typeof CAMPOS)[number] {
  return (CAMPOS as readonly string[]).includes(campo);
}

/**
 * Formulario de alta y edición de turnos.
 *
 * Valida en el cliente con el mismo esquema de Zod que usa la Server Action.
 * La validación de acá es comodidad: da feedback sin viaje al servidor, pero
 * la que decide es la del servidor, porque esta se puede saltar.
 */
export function ShiftFormDialog({
  turno,
  trigger,
}: {
  turno?: Turno;
  trigger: React.ReactElement;
}) {
  const [abierto, setAbierto] = useState(false);
  const esEdicion = turno !== undefined;

  const valoresIniciales = {
    name: turno?.name ?? "",
    startTime: turno?.startTime ?? "",
    endTime: turno?.endTime ?? "",
  };

  const form = useForm<ShiftInput>({
    resolver: zodResolver(shiftInputSchema),
    defaultValues: valoresIniciales,
  });

  const {
    formState: { errors, isSubmitting },
  } = form;

  // Se observan para adelantar en pantalla lo que va a quedar guardado: cuánto
  // dura el turno y si se va a la madrugada. Sin esto, "23:00 a 07:00" parece
  // un error de tipeo en vez de un turno nocturno.
  const [inicio, fin] = useWatch({
    control: form.control,
    name: ["startTime", "endTime"],
  });
  // Con inicio igual a fin no se resume nada: el turno no es válido y anunciar
  // "24 h" sería peor que callar.
  const horarioCompleto = Boolean(inicio) && Boolean(fin) && inicio !== fin;
  const nocturno = horarioCompleto && cruzaMedianoche(inicio, fin);

  async function alEnviar(valores: ShiftInput) {
    const resultado = esEdicion
      ? await updateShiftAction(turno.shiftId, valores)
      : await createShiftAction(valores);

    if (resultado.success) {
      toast.success(esEdicion ? "Turno actualizado." : "Turno creado.");
      setAbierto(false);
      form.reset(esEdicion ? valores : valoresIniciales);

      return;
    }

    // Los errores por campo se pintan junto al input que los provocó; el resto
    // llega como aviso general.
    const { error } = resultado;

    if (error.fieldErrors) {
      for (const [campo, mensajes] of Object.entries(error.fieldErrors)) {
        if (esCampoDeTurno(campo)) {
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
      titulo={esEdicion ? "Editar turno" : "Nuevo turno"}
      descripcion={
        esEdicion
          ? "Modificá los datos del turno."
          : "Completá los datos para registrar un turno."
      }
      textoEnviar={esEdicion ? "Guardar cambios" : "Crear turno"}
      enviando={isSubmitting}
      onSubmit={form.handleSubmit(alEnviar)}
    >
      <FormField id="name" label="Nombre" error={errors.name?.message}>
        {(props) => <Input autoFocus {...props} {...form.register("name")} />}
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          id="startTime"
          label="Hora de inicio"
          error={errors.startTime?.message}
        >
          {(props) => <Input type="time" {...props} {...form.register("startTime")} />}
        </FormField>

        <FormField id="endTime" label="Hora de fin" error={errors.endTime?.message}>
          {(props) => <Input type="time" {...props} {...form.register("endTime")} />}
        </FormField>
      </div>

      {horarioCompleto && (
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
          {nocturno && <MoonStarIcon className="size-3.5 shrink-0" />}
          Duración: {formatearDuracionDeTurno(inicio, fin)}
          {nocturno && " · cruza la medianoche"}
        </p>
      )}
    </FormDialog>
  );
}
