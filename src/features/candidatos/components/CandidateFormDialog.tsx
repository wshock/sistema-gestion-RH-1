"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  createCandidateAction,
  updateCandidateAction,
} from "@/features/candidatos/actions/candidate";
import { FormDialog } from "@/components/shared/FormDialog";
import { FormField } from "@/components/shared/FormField";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatearCurriculumComoTexto } from "@/features/candidatos/resume";
import { candidateInputSchema, type CandidateInput } from "@/features/candidatos/schemas";

type Candidato = {
  jobCandidateId: number;
  firstName: string | null;
  lastName: string | null;
  resume: string | null;
};

/**
 * Formulario de alta y edición.
 *
 * Nombre y apellido son campos propios del candidato (ver `types.ts` del
 * módulo): no se intentan adivinar a partir del currículum, que es texto
 * libre y no siempre trae de dónde sacarlos. Valida en el cliente con el
 * mismo esquema que usa la Server Action; la que decide es la del servidor,
 * porque esta se puede saltar.
 */
export function CandidateFormDialog({
  candidato,
  trigger,
}: {
  candidato?: Candidato;
  trigger: React.ReactElement;
}) {
  const [abierto, setAbierto] = useState(false);
  const esEdicion = candidato !== undefined;

  const valoresIniciales = {
    firstName: candidato?.firstName ?? "",
    lastName: candidato?.lastName ?? "",
    // Nunca se precarga el XML crudo de un currículum migrado: se muestra ya
    // reducido a texto plano, tanto por legibilidad como porque una etiqueta
    // sin espacios era, literalmente, la palabra más larga del campo —de ahí
    // el desborde horizontal que rompía el diálogo.
    resume: candidato?.resume ? formatearCurriculumComoTexto(candidato.resume) : "",
  };

  const form = useForm<CandidateInput>({
    resolver: zodResolver(candidateInputSchema),
    defaultValues: valoresIniciales,
  });

  const {
    formState: { errors, isSubmitting },
  } = form;

  async function alEnviar(valores: CandidateInput) {
    const resultado = esEdicion
      ? await updateCandidateAction(candidato.jobCandidateId, valores)
      : await createCandidateAction(valores);

    if (resultado.success) {
      toast.success(esEdicion ? "Candidato actualizado." : "Candidato creado.");
      setAbierto(false);
      form.reset(esEdicion ? valores : valoresIniciales);

      return;
    }

    // Los errores por campo se pintan junto al input que los provocó; el resto
    // llega como aviso general.
    const { error } = resultado;

    if (error.fieldErrors) {
      for (const [campo, mensajes] of Object.entries(error.fieldErrors)) {
        if (campo === "firstName" || campo === "lastName" || campo === "resume") {
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
      titulo={esEdicion ? "Editar candidato" : "Nuevo candidato"}
      descripcion={
        esEdicion
          ? "Modificá los datos del candidato."
          : "Registrá al aspirante y su currículum."
      }
      textoEnviar={esEdicion ? "Guardar cambios" : "Crear candidato"}
      enviando={isSubmitting}
      onSubmit={form.handleSubmit(alEnviar)}
      className="sm:max-w-lg"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField id="firstName" label="Nombre" error={errors.firstName?.message}>
          {(props) => <Input autoFocus {...props} {...form.register("firstName")} />}
        </FormField>

        <FormField id="lastName" label="Apellido" error={errors.lastName?.message}>
          {(props) => <Input {...props} {...form.register("lastName")} />}
        </FormField>
      </div>

      <FormField id="resume" label="Currículum" error={errors.resume?.message}>
        {(props) => (
          <Textarea
            rows={12}
            // Alto acotado con scroll propio: un currículum de miles de
            // caracteres no debe estirar el campo —ni el diálogo— sin límite.
            className="max-h-80 resize-y overflow-y-auto wrap-break-word whitespace-pre-wrap"
            {...props}
            {...form.register("resume")}
          />
        )}
      </FormField>
    </FormDialog>
  );
}
