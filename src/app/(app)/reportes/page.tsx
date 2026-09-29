import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  CalendarRangeIcon,
  DollarSignIcon,
  UserRoundSearchIcon,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireSessionUser } from "@/lib/session";

export const metadata: Metadata = { title: "Reportes" };

const REPORTES = [
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

export default async function ReportesPage() {
  await requireSessionUser();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          Reportes
        </h2>
        <p className="text-muted-foreground text-sm">
          Consultas de gestión sobre los datos reales de AdventureWorks.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
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
