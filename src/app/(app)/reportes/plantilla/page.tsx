import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getHeadcountByDepartmentAction,
  getHeadcountByShiftAction,
} from "@/features/reportes/actions/headcount";
import { HeadcountByDepartmentTable } from "@/features/reportes/components/HeadcountByDepartmentTable";
import { HeadcountByShiftTable } from "@/features/reportes/components/HeadcountByShiftTable";
import type { HeadcountReport } from "@/features/reportes/types";
import type { Result } from "@/lib/result";
import { requireSessionUser } from "@/lib/session";

export const metadata: Metadata = { title: "Plantilla — Reportes" };

function desempacar<Row>(resultado: Result<HeadcountReport<Row>>) {
  return resultado.success
    ? { reporte: resultado.data, error: undefined }
    : {
        reporte: { rows: [], unassigned: { employeeCount: 0, percentage: 0 }, total: 0 },
        error: resultado.error.message,
      };
}

/** HU-40 y HU-41 — Headcount por departamento y distribución por turno. */
export default async function PlantillaReportPage() {
  await requireSessionUser();

  const [porDepartamento, porTurno] = await Promise.all([
    getHeadcountByDepartmentAction(),
    getHeadcountByShiftAction(),
  ]);

  const departamentos = desempacar(porDepartamento);
  const turnos = desempacar(porTurno);

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
            Reportes de plantilla
          </h2>
          <p className="text-muted-foreground text-sm">
            Empleados activos agrupados por su asignación vigente. Quienes no tienen
            asignación vigente se muestran en una fila aparte y sí cuentan en el total.
          </p>
        </div>
      </div>

      <Card className="bg-card/60 overflow-hidden backdrop-blur-xl">
        <CardHeader className="border-border/60 border-b pb-3">
          <CardTitle className="text-base">Empleados por departamento</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <HeadcountByDepartmentTable
            reporte={departamentos.reporte}
            error={departamentos.error}
          />
        </CardContent>
      </Card>

      <Card className="bg-card/60 overflow-hidden backdrop-blur-xl">
        <CardHeader className="border-border/60 border-b pb-3">
          <CardTitle className="text-base">Empleados por turno</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <HeadcountByShiftTable reporte={turnos.reporte} error={turnos.error} />
        </CardContent>
      </Card>
    </div>
  );
}
