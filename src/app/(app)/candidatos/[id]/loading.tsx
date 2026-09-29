import { Card, CardContent } from "@/components/ui/card";

export default function CandidatoLoading() {
  return (
    <div className="space-y-4">
      <span className="sr-only">Cargando…</span>
      <div className="bg-muted h-4 w-32 animate-pulse rounded" />
      <div className="space-y-2">
        <div className="bg-muted h-8 w-64 max-w-full animate-pulse rounded" />
        <div className="bg-muted h-4 w-28 animate-pulse rounded" />
      </div>

      <Card className="bg-card/60 backdrop-blur-xl">
        <CardContent className="space-y-3">
          <div className="bg-muted h-4 w-24 animate-pulse rounded" />
          {Array.from({ length: 6 }, (_, linea) => (
            <div key={linea} className="bg-muted h-4 w-full animate-pulse rounded" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
