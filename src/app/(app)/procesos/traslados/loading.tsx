import { DataTable } from "@/components/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";

const columnas = [
  { id: "employee", header: "Empleado", cell: () => null },
  { id: "department", header: "Departamento", cell: () => null },
  { id: "shift", header: "Turno", cell: () => null },
  { id: "startDate", header: "Inicio", cell: () => null },
  { id: "endDate", header: "Fin", cell: () => null },
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
