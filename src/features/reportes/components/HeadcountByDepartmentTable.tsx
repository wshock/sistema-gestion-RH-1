import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatPercentage } from "@/features/reportes/format";
import type {
  HeadcountByDepartmentRow,
  HeadcountReport,
} from "@/features/reportes/types";

type Fila = HeadcountByDepartmentRow & { sinAsignacion?: boolean };

export function HeadcountByDepartmentTable({
  reporte,
  error,
}: {
  reporte: HeadcountReport<HeadcountByDepartmentRow>;
  error?: string;
}) {
  const filas: Fila[] = [...reporte.rows];

  if (reporte.unassigned.employeeCount > 0) {
    filas.push({
      departmentId: -1,
      name: "Sin asignación vigente",
      groupName: "—",
      ...reporte.unassigned,
      sinAsignacion: true,
    });
  }

  const columnas: DataTableColumn<Fila>[] = [
    {
      id: "name",
      header: "Departamento",
      cell: (fila) => (
        <span className={fila.sinAsignacion ? "italic" : "font-medium"}>{fila.name}</span>
      ),
    },
    {
      id: "groupName",
      header: "Grupo",
      className: "text-muted-foreground hidden md:table-cell",
      cell: (fila) => fila.groupName,
    },
    {
      id: "employeeCount",
      header: "Empleados",
      className: "text-right",
      cell: (fila) => <span className="tabular-nums">{fila.employeeCount}</span>,
    },
    {
      id: "percentage",
      header: "% del total",
      className: "text-right",
      cell: (fila) => (
        <span className="tabular-nums">{formatPercentage(fila.percentage)}</span>
      ),
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
        fila.sinAsignacion || fila.employeeCount === 0
          ? "text-muted-foreground"
          : undefined
      }
      pie={
        <TableRow>
          <TableCell>Total de empleados activos</TableCell>
          <TableCell className="hidden md:table-cell" />
          <TableCell className="text-right tabular-nums">{reporte.total}</TableCell>
          <TableCell className="text-right tabular-nums">
            {reporte.total > 0 ? formatPercentage(100) : "—"}
          </TableCell>
        </TableRow>
      }
    />
  );
}
