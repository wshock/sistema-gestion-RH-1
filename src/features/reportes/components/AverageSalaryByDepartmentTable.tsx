import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { formatPayRate } from "@/features/reportes/format";
import type { AverageSalaryByDepartmentRow } from "@/features/reportes/types";

/**
 * Tabla del reporte de salario promedio por departamento.
 *
 * Sin estado propio: recibe filas ya resueltas (o el mensaje de error) desde
 * la página servidor. Los departamentos sin empleados activos muestran una
 * indicación explícita en lugar de ceros engañosos en las columnas de tarifa.
 */

function CeldaTarifa({ valor }: { valor: number | null }) {
  if (valor === null) {
    return <span className="text-muted-foreground">—</span>;
  }

  return <span className="tabular-nums">{formatPayRate(valor)}</span>;
}

export function AverageSalaryByDepartmentTable({
  filas,
  error,
}: {
  filas: AverageSalaryByDepartmentRow[];
  error?: string;
}) {
  const columnas: DataTableColumn<AverageSalaryByDepartmentRow>[] = [
    {
      id: "name",
      header: "Departamento",
      cell: (fila) => <span className="font-medium">{fila.name}</span>,
    },
    {
      id: "groupName",
      header: "Grupo",
      className: "text-muted-foreground hidden md:table-cell",
      cell: (fila) => fila.groupName,
    },
    {
      id: "employeeCount",
      header: "Activos",
      className: "text-right",
      cell: (fila) => {
        if (fila.employeeCount === 0) {
          return (
            <Badge variant="secondary" className="font-normal">
              Sin empleados activos
            </Badge>
          );
        }

        return (
          <span className="tabular-nums">
            {fila.employeeCount}
            {fila.withoutPayCount > 0 ? (
              <span className="text-muted-foreground ml-1 text-xs">
                ({fila.withoutPayCount} sin salario)
              </span>
            ) : null}
          </span>
        );
      },
    },
    {
      id: "averageRate",
      header: "Promedio",
      className: "text-right",
      cell: (fila) => <CeldaTarifa valor={fila.averageRate} />,
    },
    {
      id: "minRate",
      header: "Mínimo",
      className: "text-right hidden sm:table-cell",
      cell: (fila) => <CeldaTarifa valor={fila.minRate} />,
    },
    {
      id: "maxRate",
      header: "Máximo",
      className: "text-right hidden sm:table-cell",
      cell: (fila) => <CeldaTarifa valor={fila.maxRate} />,
    },
  ];

  return (
    <DataTable
      columnas={columnas}
      filas={filas}
      idDeFila={(fila) => fila.departmentId}
      error={error}
      vacio="Todavía no hay departamentos registrados."
      claseDeFila={(fila) =>
        fila.employeeCount === 0 ? "text-muted-foreground" : undefined
      }
    />
  );
}
