import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { getCandidateStatusReportAction } from "@/features/reportes/actions/candidates";
import { CandidateStatusReportView } from "@/features/reportes/components/CandidateStatusReport";
import { requireSessionUser } from "@/lib/session";

export const metadata: Metadata = { title: "Candidatos — Reportes" };

/**
 * HU-46 — Reporte de estado de candidatos.
 *
 * Pendientes vs contratados según `businessEntityId`, más tasa de conversión.
 * Los conteos salen de una agregación en la base, la misma regla que usa el
 * módulo de candidatos.
 */
export default async function CandidatosReportPage() {
  await requireSessionUser();

  const resultado = await getCandidateStatusReportAction();
  const reporte = resultado.success ? resultado.data : null;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Link
          href="/reportes"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
        >
          <ArrowLeftIcon className="size-3.5" />
          Reportes
        </Link>
        <div>
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            Estado de candidatos
          </h2>
          <p className="text-muted-foreground text-sm">
            Conteo de pendientes y contratados. Un candidato cuenta como
            contratado cuando tiene un empleado asociado.
          </p>
        </div>
      </div>

      <Card className="bg-card/60 overflow-hidden backdrop-blur-xl">
        <CardContent className="p-0">
          <CandidateStatusReportView
            reporte={reporte}
            error={resultado.success ? undefined : resultado.error.message}
          />
        </CardContent>
      </Card>
    </div>
  );
}
