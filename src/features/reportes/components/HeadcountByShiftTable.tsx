import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatPercentage, formatShiftSchedule } from "@/features/reportes/format";
import type { HeadcountByShiftRow, HeadcountReport } from "@/features/reportes/types";

type Fila = HeadcountByShiftRow & { sinAsignacion?: boolean };

export function HeadcountByShiftTable({
  reporte,
  error,
}: {
  reporte: HeadcountReport<HeadcountByShiftRow>;
  error?: string;
}) {
  const filas: Fila[] = [...reporte.rows];

  if (reporte.unassigned.employeeCount > 0) {
    filas.push({
      shiftId: -1,
      name: "Sin asignación vigente",
      startTime: "",
      endTime: "",
      crossesMidnight: false,
      ...reporte.unassigned,
      sinAsignacion: true,
    });
  }

  const columnas: DataTableColumn<Fila>[] = [
    {
      id: "name",
      header: "Turno",
      cell: (fila) => (
        <span className={fila.sinAsignacion ? "italic" : "font-medium"}>{fila.name}</span>
      ),
    },
    {
      id: "schedule",
      header: "Horario",
      className: "text-muted-foreground tabular-nums",
      cell: (fila) =>
        fila.sinAsignacion
          ? "—"
          : formatShiftSchedule(fila.startTime, fila.endTime, fila.crossesMidnight),
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
      idDeFila={(fila) => fila.shiftId}
      error={error}
      vacio="Todavía no hay turnos registrados."
      claseDeFila={(fila) =>
        fila.sinAsignacion || fila.employeeCount === 0
          ? "text-muted-foreground"
          : undefined
      }
      pie={
        <TableRow>
          <TableCell>Total de empleados activos</TableCell>
          <TableCell />
          <TableCell className="text-right tabular-nums">{reporte.total}</TableCell>
          <TableCell className="text-right tabular-nums">
            {reporte.total > 0 ? formatPercentage(100) : "—"}
          </TableCell>
        </TableRow>
      }
    />
  );
}
