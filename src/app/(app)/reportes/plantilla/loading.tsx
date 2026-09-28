import { DataTable } from "@/components/shared/DataTable";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function columnas(titulos: string[]) {
  return titulos.map((titulo) => ({ id: titulo, header: titulo, cell: () => null }));
}

const SECCIONES = [
  {
    id: "departamento",
    columnas: columnas(["Departamento", "Empleados", "% del total"]),
    filas: 8,
  },
  {
    id: "turno",
    columnas: columnas(["Turno", "Horario", "Empleados", "% del total"]),
    filas: 3,
  },
];

export default function PlantillaLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="bg-muted h-4 w-20 animate-pulse rounded" />
        <div className="bg-muted h-8 w-64 max-w-full animate-pulse rounded" />
        <div className="bg-muted h-4 w-full max-w-xl animate-pulse rounded" />
      </div>

      {SECCIONES.map((seccion) => (
        <Card key={seccion.id} className="bg-card/60 overflow-hidden backdrop-blur-xl">
          <CardHeader className="border-border/60 border-b pb-3">
            <div className="bg-muted h-5 w-48 animate-pulse rounded" />
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columnas={seccion.columnas}
              filas={[]}
              idDeFila={() => 0}
              cargando
              filasDeCarga={seccion.filas}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
