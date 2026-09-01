import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ArrowUpRightIcon } from "lucide-react";

import { CandidateDetailActions } from "@/features/candidatos/components/CandidateDetailActions";
import { CandidateResume } from "@/features/candidatos/components/CandidateResume";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireSessionUser } from "@/lib/session";
import { candidateIdSchema } from "@/features/candidatos/schemas";
import { getCandidateDetail } from "@/features/candidatos/services/read.service";

export const metadata: Metadata = { title: "Candidato" };

export default async function CandidatoPage({
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
    notFound();
  }

  const resultado = await getCandidateDetail(idValidado.data);

  if (!resultado.success) {
    if (resultado.error.code === "NO_ENCONTRADO") {
      notFound();
    }

    return (
      <p className="text-destructive text-sm" role="alert">
        {resultado.error.message}
      </p>
    );
  }

  const candidato = resultado.data;

  return (
    <div className="space-y-4">
      <Link
        href="/candidatos"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeftIcon className="size-4" />
        Volver al listado
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            {candidato.name ?? `Candidato #${candidato.jobCandidateId}`}
          </h2>
          <p className="text-muted-foreground text-sm">
            Candidato #{candidato.jobCandidateId}
          </p>

          {candidato.businessEntityId !== null && (
            <Link
              href={`/empleados/${candidato.businessEntityId}`}
              className="text-primary mt-1 inline-flex items-center gap-1 text-sm hover:underline"
            >
              Ver ficha del empleado
              <ArrowUpRightIcon className="size-3.5" />
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={candidato.status === "contratado" ? "secondary" : "outline"}>
            {candidato.status === "contratado" ? "Contratado" : "Pendiente"}
          </Badge>

          <CandidateDetailActions candidato={candidato} />
        </div>
      </div>

      <Card className="bg-card/60 backdrop-blur-xl">
        <CardContent className="space-y-3">
          <h3 className="font-heading text-sm font-semibold tracking-tight">
            Currículum
          </h3>

          <CandidateResume resume={candidato.resume} />
        </CardContent>
      </Card>
    </div>
  );
}
