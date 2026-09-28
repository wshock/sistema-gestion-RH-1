import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { getAverageSalaryByDepartmentAction } from "@/features/reportes/actions/compensation";
import { AverageSalaryByDepartmentTable } from "@/features/reportes/components/AverageSalaryByDepartmentTable";
import { requireSessionUser } from "@/lib/session";

export const metadata: Metadata = { title: "Compensación — Reportes" };

/**
 * HU-44 — Reporte de salario promedio por departamento.
 *
 * La agregación se resuelve en la base. Los empleados sin historial salarial
 * se cuentan aparte y no entran en promedio, mínimo ni máximo; la tabla lo
 * indica cuando aplica.
 */
export default async function CompensacionReportPage() {
  await requireSessionUser();

  const resultado = await getAverageSalaryByDepartmentAction();
  const filas = resultado.success ? resultado.data : [];

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
            Salario promedio por departamento
          </h2>
          <p className="text-muted-foreground text-sm">
            Tarifa horaria vigente de empleados activos, agrupada por su
            asignación actual. El promedio, el mínimo y el máximo excluyen a
            quienes aún no tienen historial salarial.
          </p>
        </div>
      </div>

      <Card className="bg-card/60 overflow-hidden backdrop-blur-xl">
        <CardContent className="p-0">
          <AverageSalaryByDepartmentTable
            filas={filas}
            error={resultado.success ? undefined : resultado.error.message}
          />
        </CardContent>
      </Card>
    </div>
  );
}
