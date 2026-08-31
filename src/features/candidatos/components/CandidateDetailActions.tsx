"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BriefcaseIcon, PencilIcon, Trash2Icon } from "lucide-react";

import { CandidateFormDialog } from "@/features/candidatos/components/CandidateFormDialog";
import { DeleteCandidateDialog } from "@/features/candidatos/components/DeleteCandidateDialog";
import { Button } from "@/components/ui/button";
import type { CandidateDetail } from "@/features/candidatos/types";

/**
 * Contratar, editar y eliminar desde la ficha. Un candidato contratado no
 * aparece con ninguna de las tres: ya no hay proceso que iniciar, y editar o
 * eliminar afectarían la trazabilidad de una contratación ya decidida.
 */
export function CandidateDetailActions({ candidato }: { candidato: CandidateDetail }) {
  const router = useRouter();

  if (candidato.status !== "pendiente") {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        render={<Link href={`/candidatos/${candidato.jobCandidateId}/contratar`} />}
      >
        <BriefcaseIcon />
        Contratar
      </Button>

      <CandidateFormDialog
        candidato={{ jobCandidateId: candidato.jobCandidateId, resume: candidato.resume }}
        trigger={
          <Button variant="outline" size="sm">
            <PencilIcon />
            Editar
          </Button>
        }
      />

      <DeleteCandidateDialog
        jobCandidateId={candidato.jobCandidateId}
        nombre={candidato.name ?? `Candidato #${candidato.jobCandidateId}`}
        // La ficha del candidato borrado ya no tiene sentido: se vuelve al
        // listado en lugar de dejar al usuario sobre una página vacía.
        onEliminado={() => router.push("/candidatos")}
        trigger={
          <Button variant="outline" size="sm">
            <Trash2Icon />
            Eliminar
          </Button>
        }
      />
    </div>
  );
}
