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
import { Textarea } from "@/components/ui/textarea";
import { formatearCurriculumComoTexto } from "@/features/candidatos/resume";
import { candidateInputSchema, type CandidateInput } from "@/features/candidatos/schemas";

type Candidato = { jobCandidateId: number; resume: string | null };

/**
 * Formulario de alta y edición.
 *
 * Un solo campo porque `JobCandidate` no tiene más datos propios que el
 * currículum (ver `docs`, y `types.ts` del módulo). Valida en el cliente con
 * el mismo esquema que usa la Server Action; la que decide es la del
 * servidor, porque esta se puede saltar.
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

    if (error.fieldErrors?.resume) {
      form.setError("resume", { message: error.fieldErrors.resume[0] });
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
          ? "Modificá el currículum registrado."
          : "Registrá el currículum del aspirante."
      }
      textoEnviar={esEdicion ? "Guardar cambios" : "Crear candidato"}
      enviando={isSubmitting}
      onSubmit={form.handleSubmit(alEnviar)}
      className="sm:max-w-lg"
    >
      <FormField id="resume" label="Currículum" error={errors.resume?.message}>
        {(props) => (
          <Textarea
            rows={12}
            autoFocus
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
