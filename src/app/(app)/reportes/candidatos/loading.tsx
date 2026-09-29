import { Card, CardContent } from "@/components/ui/card";

/**
 * Esqueleto de carga del reporte de estado de candidatos.
 */

export default function CandidatosReportLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="bg-muted h-4 w-20 animate-pulse rounded" />
        <div className="bg-muted h-8 w-64 max-w-full animate-pulse rounded" />
        <div className="bg-muted h-4 w-full max-w-xl animate-pulse rounded" />
      </div>

      <Card className="bg-card/60 overflow-hidden backdrop-blur-xl">
        <CardContent className="space-y-4 p-4">
          <div className="flex justify-between gap-4">
            <div className="bg-muted h-4 w-40 animate-pulse rounded" />
            <div className="bg-muted h-4 w-44 animate-pulse rounded" />
          </div>
          <div className="space-y-3">
            <div className="bg-muted h-4 w-full animate-pulse rounded" />
            <div className="bg-muted h-4 w-full animate-pulse rounded" />
          </div>
          <span className="sr-only">Cargando…</span>
        </CardContent>
      </Card>
    </div>
  );
}
