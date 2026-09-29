import { Card, CardContent } from "@/components/ui/card";

function CampoEsqueleto() {
  return (
    <div className="space-y-1.5">
      <div className="bg-muted h-4 w-24 animate-pulse rounded" />
      <div className="bg-muted h-8 w-full animate-pulse rounded-lg" />
    </div>
  );
}

export default function ContratarLoading() {
  return (
    <div className="space-y-4">
      <span className="sr-only">Cargando…</span>
      <div className="bg-muted h-4 w-32 animate-pulse rounded" />
      <div className="space-y-2">
        <div className="bg-muted h-8 w-72 max-w-full animate-pulse rounded" />
        <div className="bg-muted h-4 w-full max-w-xl animate-pulse rounded" />
      </div>

      <Card className="bg-card/60 backdrop-blur-xl">
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }, (_, linea) => (
            <div key={linea} className="bg-muted h-4 w-full animate-pulse rounded" />
          ))}
        </CardContent>
      </Card>

      <Card className="bg-card/60 backdrop-blur-xl">
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, campo) => (
            <CampoEsqueleto key={campo} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
