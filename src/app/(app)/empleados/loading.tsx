import { DataTable } from "@/components/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";

const COLUMNAS = [
  { id: "nombre", header: "Nombre", cell: () => null },
  {
    id: "documento",
    header: "Documento",
    className: "hidden md:table-cell",
    cell: () => null,
  },
  { id: "cargo", header: "Cargo", className: "hidden lg:table-cell", cell: () => null },
  {
    id: "departamento",
    header: "Departamento",
    className: "hidden sm:table-cell",
    cell: () => null,
  },
  { id: "estado", header: "Estado", cell: () => null },
  { id: "acciones", header: "Acciones", cell: () => null },
];

export default function EmpleadosLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="bg-muted h-8 w-40 animate-pulse rounded" />
        <div className="bg-muted h-4 w-72 max-w-full animate-pulse rounded" />
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="bg-muted h-8 w-full animate-pulse rounded-lg sm:w-72" />
        <div className="bg-muted h-8 w-40 animate-pulse rounded-lg" />
        <div className="bg-muted h-8 w-32 animate-pulse rounded-lg" />
      </div>

      <Card className="bg-card/60 overflow-hidden backdrop-blur-xl">
        <CardContent className="p-0">
          <DataTable
            columnas={COLUMNAS}
            filas={[]}
            idDeFila={() => 0}
            cargando
            filasDeCarga={10}
          />
        </CardContent>
      </Card>
    </div>
  );
}
