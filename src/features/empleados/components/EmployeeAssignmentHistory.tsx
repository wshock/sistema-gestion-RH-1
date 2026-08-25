import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCalendarDate } from "@/features/empleados/format";
import type { EmployeeAssignment } from "@/features/empleados/types";

/**
 * Historial de asignaciones a departamento y turno.
 *
 * La fila abierta (`endDate === null`) es la vigente: se etiqueta y no se
 * atenúa. Las cerradas muestran fecha de fin. El orden descendente lo resuelve
 * el servicio; acá solo se pinta.
 */

function estaVigente(asignacion: EmployeeAssignment): boolean {
  return asignacion.endDate === null;
}

export function EmployeeAssignmentHistory({
  history,
}: {
  history: EmployeeAssignment[];
}) {
  const columnas: DataTableColumn<EmployeeAssignment>[] = [
    {
      id: "departmentName",
      header: "Departamento",
      cell: (asignacion) => (
        <span className={estaVigente(asignacion) ? "font-medium" : undefined}>
          {asignacion.departmentName}
        </span>
      ),
    },
    {
      id: "shiftName",
      header: "Turno",
      className: "text-muted-foreground",
      cell: (asignacion) => asignacion.shiftName,
    },
    {
      id: "startDate",
      header: "Inicio",
      className: "text-muted-foreground",
      cell: (asignacion) => formatCalendarDate(asignacion.startDate),
    },
    {
      id: "endDate",
      header: "Fin",
      className: "text-muted-foreground",
      cell: (asignacion) =>
        asignacion.endDate ? formatCalendarDate(asignacion.endDate) : "—",
    },
    {
      id: "estado",
      header: "Estado",
      cell: (asignacion) =>
        estaVigente(asignacion) ? (
          <Badge variant="secondary">Vigente</Badge>
        ) : (
          <Badge variant="outline">Cerrada</Badge>
        ),
    },
  ];

  return (
    <Card className="bg-card/60 overflow-hidden backdrop-blur-xl">
      <CardContent className="space-y-3">
        <h3 className="font-heading text-sm font-semibold tracking-tight">
          Historial de departamentos
        </h3>
      </CardContent>
      <CardContent className="p-0">
        <DataTable
          columnas={columnas}
          filas={history}
          idDeFila={(asignacion) =>
            `${asignacion.startDate}-${asignacion.departmentId}-${asignacion.shiftId}`
          }
          claseDeFila={(asignacion) =>
            estaVigente(asignacion) ? undefined : "text-muted-foreground"
          }
          vacio="Este empleado no tiene asignaciones de departamento."
        />
      </CardContent>
    </Card>
  );
}
