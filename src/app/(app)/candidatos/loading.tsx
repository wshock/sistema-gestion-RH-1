import { DataTable } from "@/components/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";

const COLUMNAS = [
  { id: "nombre", header: "Candidato", cell: () => null },
  { id: "estado", header: "Estado", cell: () => null },
  { id: "acciones", header: "Acciones", cell: () => null },
];

export default function CandidatosLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="bg-muted h-8 w-40 animate-pulse rounded" />
        <div className="bg-muted h-4 w-80 max-w-full animate-pulse rounded" />
      </div>

      <div className="bg-muted h-8 w-40 animate-pulse rounded-lg" />

      <Card className="bg-card/60 overflow-hidden backdrop-blur-xl">
        <CardContent className="p-0">
          <DataTable
            columnas={COLUMNAS}
            filas={[]}
            idDeFila={() => 0}
            cargando
            filasDeCarga={8}
          />
        </CardContent>
      </Card>
    </div>
  );
}
