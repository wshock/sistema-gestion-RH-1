import Link from "next/link";

import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import {
  formatCalendarDate,
  formatYearsOfService,
} from "@/features/reportes/format";
import type { SeniorityEmployeeRow } from "@/features/reportes/types";

/**
 * Detalle paginado del reporte de antigüedad.
 *
 * El orden (contratación ascendente) lo resuelve la consulta; esta tabla solo
 * pinta lo que recibe.
 */

export function SeniorityDetailTable({
  filas,
  error,
}: {
  filas: SeniorityEmployeeRow[];
  error?: string;
}) {
  const columnas: DataTableColumn<SeniorityEmployeeRow>[] = [
    {
      id: "nombre",
      header: "Empleado",
      cell: (fila) => (
        <Link
          href={`/empleados/${fila.businessEntityId}`}
          className="font-medium hover:underline"
        >
          {fila.lastName}, {fila.firstName}
        </Link>
      ),
    },
    {
      id: "jobTitle",
      header: "Cargo",
      className: "hidden sm:table-cell",
      cell: (fila) => fila.jobTitle,
    },
    {
      id: "hireDate",
      header: "Contratación",
      className: "text-muted-foreground",
      cell: (fila) => formatCalendarDate(fila.hireDate),
    },
    {
      id: "yearsOfService",
      header: "Antigüedad",
      className: "text-right",
      cell: (fila) => (
        <span className="tabular-nums font-medium">
          {formatYearsOfService(fila.yearsOfService)}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columnas={columnas}
      filas={filas}
      idDeFila={(fila) => fila.businessEntityId}
      error={error}
      vacio="No hay empleados activos para listar."
    />
  );
}
