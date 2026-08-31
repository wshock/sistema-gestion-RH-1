import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { listAllDepartments } from "@/features/departamentos/data/department";
import { listAllShifts } from "@/features/turnos/data/shift";
import { CandidateResume } from "@/features/candidatos/components/CandidateResume";
import { HireCandidateForm } from "@/features/candidatos/components/HireCandidateForm";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireSessionUser } from "@/lib/session";
import { candidateIdSchema } from "@/features/candidatos/schemas";
import { getCandidateForHire } from "@/features/candidatos/services/hire.service";

export const metadata: Metadata = { title: "Contratar candidato" };

export default async function ContratarCandidatoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // El proxy ya filtró, pero esta es la comprobación que de verdad protege:
  // corre en el servidor, pegada a la lectura de datos.
  await requireSessionUser();

  const { id } = await params;
  const idValidado = candidateIdSchema.safeParse(id);

  if (!idValidado.success) {
    return (
      <MensajeDeAcceso
        mensaje="El identificador del candidato no es válido."
        volverA="/candidatos"
      />
    );
  }

  const [resultado, departamentos, turnos] = await Promise.all([
    getCandidateForHire(idValidado.data),
    listAllDepartments(),
    listAllShifts(),
  ]);

  // Candidato inexistente o ya contratado: los dos casos se explican en
  // términos de negocio, nunca con un error técnico o el 404 genérico.
  if (!resultado.success) {
    return (
      <MensajeDeAcceso
        mensaje={resultado.error.message}
        volverA={
          resultado.error.code === "NO_ENCONTRADO"
            ? "/candidatos"
            : `/candidatos/${idValidado.data}`
        }
      />
    );
  }

  const candidato = resultado.data;

  return (
    <div className="space-y-4">
      <Link
        href={`/candidatos/${candidato.jobCandidateId}`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeftIcon className="size-4" />
        Volver al candidato
      </Link>

      <div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          Contratar a {candidato.name ?? `candidato #${candidato.jobCandidateId}`}
        </h2>
        <p className="text-muted-foreground text-sm">
          El nombre y el currículum son del candidato y no se editan acá; completá el
          resto para registrar su incorporación.
        </p>
      </div>

      <Card className="bg-card/60 backdrop-blur-xl">
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-heading text-sm font-semibold tracking-tight">
              Datos del candidato
            </h3>
            <Badge variant="outline">Pendiente</Badge>
          </div>

          <div className="min-w-0 space-y-1">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Nombre
            </p>
            <p className="text-sm wrap-break-word">
              {candidato.name ?? (
                <span className="text-muted-foreground">
                  Sin nombre detectable en el currículum
                </span>
              )}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Currículum
            </p>
            <CandidateResume resume={candidato.resume} />
          </div>
        </CardContent>
      </Card>

      <HireCandidateForm
        jobCandidateId={candidato.jobCandidateId}
        departamentos={departamentos}
        turnos={turnos}
      />
    </div>
  );
}

function MensajeDeAcceso({ mensaje, volverA }: { mensaje: string; volverA: string }) {
  return (
    <div className="space-y-4">
      <Link
        href={volverA}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeftIcon className="size-4" />
        Volver
      </Link>

      <div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          No es posible continuar
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">{mensaje}</p>
      </div>
    </div>
  );
}
