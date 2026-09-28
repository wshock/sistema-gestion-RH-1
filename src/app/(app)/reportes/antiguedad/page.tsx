import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { Pagination } from "@/components/shared/Pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSeniorityReportAction } from "@/features/reportes/actions/seniority";
import { SeniorityBracketSummary } from "@/features/reportes/components/SeniorityBracketSummary";
import { SeniorityDetailTable } from "@/features/reportes/components/SeniorityDetailTable";
import { seniorityQuerySchema } from "@/features/reportes/schemas";
import { requireSessionUser } from "@/lib/session";

export const metadata: Metadata = { title: "Antigüedad — Reportes" };

/**
 * HU-45 — Reporte de antigüedad del personal.
 *
 * Resumen por tramos + detalle paginado ordenado por fecha de contratación.
 * Las antigüedades elevadas de AdventureWorks se muestran tal cual.
 */
export default async function AntiguedadReportPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireSessionUser();

  const params = await searchParams;
  const query = seniorityQuerySchema.parse({ page: params.page });
  const resultado = await getSeniorityReportAction(query);

  const { brackets, items, total, page, pageCount } = resultado.success
    ? resultado.data
    : { brackets: [], items: [], total: 0, page: 1, pageCount: 1 };

  const error = resultado.success ? undefined : resultado.error.message;

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
            Antigüedad del personal
          </h2>
          <p className="text-muted-foreground text-sm">
            Empleados activos ordenados por fecha de contratación. Los años se
            calculan a la fecha de hoy a partir de esa fecha real.
          </p>
        </div>
      </div>

      <Card className="bg-card/60 overflow-hidden backdrop-blur-xl">
        <CardHeader className="border-border/60 border-b pb-3">
          <CardTitle className="text-base">Distribución por tramos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <SeniorityBracketSummary tramos={brackets} error={error} />
        </CardContent>
      </Card>

      <Card className="bg-card/60 overflow-hidden backdrop-blur-xl">
        <CardHeader className="border-border/60 border-b pb-3">
          <CardTitle className="text-base">Detalle por empleado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-0">
          <SeniorityDetailTable filas={items} error={error} />
          <div className="px-4 pb-4">
            <Pagination
              page={page}
              pageCount={pageCount}
              total={total}
              basePath="/reportes/antiguedad"
              singular="empleado"
              plural="empleados"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
