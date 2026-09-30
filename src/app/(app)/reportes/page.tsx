import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  CalendarRangeIcon,
  DollarSignIcon,
  UserRoundSearchIcon,
  UsersRoundIcon,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getReportTotalsAction } from "@/features/reportes/actions/summary";
import {
  ReportTotalsPanel,
  ReportTotalsPanelSkeleton,
} from "@/features/reportes/components/ReportTotalsPanel";
import { requireSessionUser } from "@/lib/session";

export const metadata: Metadata = { title: "Reportes" };

const REPORTES = [
  {
    href: "/reportes/plantilla",
    title: "Plantilla",
    description:
      "Empleados activos por departamento y por turno, según la asignación vigente de cada uno.",
    icon: UsersRoundIcon,
  },
  {
    href: "/reportes/compensacion",
    title: "Compensación",
    description:
      "Salario promedio, mínimo y máximo por departamento, según la tarifa vigente de cada empleado activo.",
    icon: DollarSignIcon,
  },
  {
    href: "/reportes/antiguedad",
    title: "Antigüedad",
    description:
      "Distribución por tramos y listado de empleados activos ordenados por fecha de contratación.",
    icon: CalendarRangeIcon,
  },
  {
    href: "/reportes/candidatos",
    title: "Candidatos",
    description:
      "Pendientes frente a contratados y tasa de conversión del proceso de selección.",
    icon: UserRoundSearchIcon,
  },
] as const;

async function TotalesGenerales() {
  const resultado = await getReportTotalsAction();

  return resultado.success ? (
    <ReportTotalsPanel totales={resultado.data} />
  ) : (
    <ReportTotalsPanel totales={null} error={resultado.error.message} />
  );
}

export default async function ReportesPage() {
  await requireSessionUser();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">Reportes</h2>
        <p className="text-muted-foreground text-sm">
          Consultas de gestión sobre los datos reales de AdventureWorks.
        </p>
      </div>

      <Suspense fallback={<ReportTotalsPanelSkeleton />}>
        <TotalesGenerales />
      </Suspense>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {REPORTES.map(({ href, title, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="rounded-xl outline-none focus-visible:ring-3"
          >
            <Card className="bg-card/60 hover:border-primary/30 h-full backdrop-blur-xl transition-colors">
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <span className="bg-primary/10 grid size-9 shrink-0 place-items-center rounded-lg">
                    <Icon className="size-4" />
                  </span>
                  <CardTitle className="text-base">{title}</CardTitle>
                  <ArrowRightIcon className="text-muted-foreground ml-auto size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
