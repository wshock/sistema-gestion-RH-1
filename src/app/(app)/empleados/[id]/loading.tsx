import { Card, CardContent } from "@/components/ui/card";

/**
 * Esqueleto de carga de la ficha de empleado.
 */
export default function EmpleadoDetalleLoading() {
  return (
    <div className="space-y-4">
      <span className="sr-only">Cargando…</span>
      <div className="bg-muted h-4 w-32 animate-pulse rounded" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="bg-muted h-8 w-64 max-w-full animate-pulse rounded" />
          <div className="bg-muted h-4 w-40 animate-pulse rounded" />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="bg-muted h-8 w-20 animate-pulse rounded-lg" />
          <div className="bg-muted h-8 w-24 animate-pulse rounded-lg" />
          <div className="bg-muted h-8 w-28 animate-pulse rounded-lg" />
        </div>
      </div>

      <Card className="bg-card/60 backdrop-blur-xl">
        <CardContent className="space-y-3">
          {Array.from({ length: 6 }, (_, linea) => (
            <div key={linea} className="bg-muted h-4 w-full animate-pulse rounded" />
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-card/60 backdrop-blur-xl">
          <CardContent className="space-y-3">
            <div className="bg-muted h-4 w-40 animate-pulse rounded" />
            {Array.from({ length: 4 }, (_, linea) => (
              <div key={linea} className="bg-muted h-4 w-full animate-pulse rounded" />
            ))}
          </CardContent>
        </Card>
        <Card className="bg-card/60 backdrop-blur-xl">
          <CardContent className="space-y-3">
            <div className="bg-muted h-4 w-36 animate-pulse rounded" />
            {Array.from({ length: 4 }, (_, linea) => (
              <div key={linea} className="bg-muted h-4 w-full animate-pulse rounded" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
