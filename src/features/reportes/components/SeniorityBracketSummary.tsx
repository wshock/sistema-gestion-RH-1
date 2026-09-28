import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import type { SeniorityBracketRow } from "@/features/reportes/types";

/**
 * Resumen de la distribución de antigüedad por tramos.
 *
 * Siempre recibe los cinco tramos (aunque alguno esté en cero) para que la
 * lectura de gestión no dependa de qué cajas tengan gente hoy.
 */

export function SeniorityBracketSummary({
  tramos,
  error,
}: {
  tramos: SeniorityBracketRow[];
  error?: string;
}) {
  const columnas: DataTableColumn<SeniorityBracketRow>[] = [
    {
      id: "label",
      header: "Tramo",
      cell: (fila) => <span className="font-medium">{fila.label}</span>,
    },
    {
      id: "employeeCount",
      header: "Empleados",
      className: "text-right",
      cell: (fila) => <span className="tabular-nums">{fila.employeeCount}</span>,
    },
  ];

  return (
    <DataTable
      columnas={columnas}
      filas={tramos}
      idDeFila={(fila) => fila.bracketId}
      error={error}
      vacio="No hay empleados activos para resumir."
      claseDeFila={(fila) =>
        fila.employeeCount === 0 ? "text-muted-foreground" : undefined
      }
    />
  );
}
