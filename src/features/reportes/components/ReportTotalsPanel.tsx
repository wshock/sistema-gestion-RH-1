import {
  AlertCircleIcon,
  Building2Icon,
  UserRoundSearchIcon,
  UsersIcon,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { ReportTotals } from "@/features/reportes/types";

const CIFRAS = [
  { key: "activeEmployees", label: "Empleados activos", icon: UsersIcon },
  { key: "departments", label: "Departamentos registrados", icon: Building2Icon },
  { key: "pendingCandidates", label: "Candidatos pendientes", icon: UserRoundSearchIcon },
] as const;

export function ReportTotalsPanel({
  totales,
  error,
}: {
  totales: ReportTotals | null;
  error?: string;
}) {
  if (error || !totales) {
    return (
      <Card className="bg-card/60 backdrop-blur-xl">
        <CardContent className="text-destructive flex items-center gap-2 py-6 text-sm">
          <AlertCircleIcon className="size-4 shrink-0" />
          {error ?? "No se pudieron cargar los totales."}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {CIFRAS.map(({ key, label, icon: Icon }) => (
        <Card key={key} className="bg-card/60 backdrop-blur-xl">
          <CardContent className="flex items-center gap-3">
            <span className="bg-primary/10 grid size-10 shrink-0 place-items-center rounded-lg">
              <Icon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="font-heading text-2xl font-semibold tabular-nums">
                {totales[key].toLocaleString("es-CO")}
              </p>
              <p className="text-muted-foreground truncate text-sm">{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ReportTotalsPanelSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {CIFRAS.map(({ key }) => (
        <Card key={key} className="bg-card/60 backdrop-blur-xl">
          <CardContent className="flex items-center gap-3">
            <span className="sr-only">Cargando…</span>
            <div className="bg-muted size-10 shrink-0 animate-pulse rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="bg-muted h-7 w-16 animate-pulse rounded" />
              <div className="bg-muted h-4 w-32 max-w-full animate-pulse rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
