import { DataTable } from "@/components/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";

const columnas = [
  { id: "employee", header: "Empleado", cell: () => null },
  { id: "rate", header: "Tarifa", cell: () => null },
  { id: "frequency", header: "Frecuencia", cell: () => null },
  { id: "date", header: "Fecha de cambio", cell: () => null },
  { id: "status", header: "Estado", cell: () => null },
];

export default function Loading() {
  return (
    <Card>
      <CardContent className="p-0">
        <DataTable columnas={columnas} filas={[]} idDeFila={() => "loading"} cargando />
      </CardContent>
    </Card>
  );
}
