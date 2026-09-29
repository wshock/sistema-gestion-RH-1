import { Card, CardContent } from "@/components/ui/card";

/**
 * Esqueleto compartido por alta, edición, cambio salarial y traslado.
 */
export default function EmpleadoFormularioLoading() {
  return (
    <div className="space-y-4">
      <span className="sr-only">Cargando…</span>
      <div className="bg-muted h-4 w-28 animate-pulse rounded" />
      <div className="space-y-2">
        <div className="bg-muted h-8 w-56 max-w-full animate-pulse rounded" />
        <div className="bg-muted h-4 w-48 animate-pulse rounded" />
      </div>

      <Card className="bg-card/60 backdrop-blur-xl">
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 8 }, (_, campo) => (
            <div key={campo} className="space-y-2">
              <div className="bg-muted h-3 w-24 animate-pulse rounded" />
              <div className="bg-muted h-9 w-full animate-pulse rounded-lg" />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <div className="bg-muted h-9 w-24 animate-pulse rounded-lg" />
        <div className="bg-muted h-9 w-32 animate-pulse rounded-lg" />
      </div>
    </div>
  );
}
