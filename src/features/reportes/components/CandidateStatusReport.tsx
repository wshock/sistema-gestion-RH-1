import { AlertCircleIcon, InboxIcon } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { formatConversionRate } from "@/features/reportes/format";
import type { CandidateStatusReport as CandidateStatusReportData } from "@/features/reportes/types";

/**
 * Vista del reporte de estado de candidatos.
 *
 * Muestra total y tasa de conversión arriba, y el desglose pendientes /
 * contratados en la misma tabla genérica que usan los otros reportes.
 */

type EstadoFila = {
  id: "pendiente" | "contratado";
  label: string;
  count: number;
};

export function CandidateStatusReportView({
  reporte,
  error,
}: {
  reporte: CandidateStatusReportData | null;
  error?: string;
}) {
  if (error) {
    return (
      <p className="text-destructive flex items-center justify-center gap-2 px-4 py-10 text-sm">
        <AlertCircleIcon className="size-4 shrink-0" />
        {error}
      </p>
    );
  }

  if (!reporte || reporte.total === 0) {
    return (
      <p className="text-muted-foreground flex items-center justify-center gap-2 px-4 py-10 text-sm">
        <InboxIcon className="size-4 shrink-0" />
        Todavía no hay candidatos registrados.
      </p>
    );
  }

  const filas: EstadoFila[] = [
    { id: "pendiente", label: "Pendientes", count: reporte.pending },
    { id: "contratado", label: "Contratados", count: reporte.hired },
  ];

  const columnas: DataTableColumn<EstadoFila>[] = [
    {
      id: "label",
      header: "Estado",
      cell: (fila) => <span className="font-medium">{fila.label}</span>,
    },
    {
      id: "count",
      header: "Cantidad",
      className: "text-right",
      cell: (fila) => <span className="tabular-nums">{fila.count}</span>,
    },
  ];

  return (
    <div>
      <div className="border-border/60 flex flex-wrap items-baseline justify-between gap-2 border-b px-4 py-3 text-sm">
        <p>
          <span className="text-muted-foreground">Total registrados: </span>
          <span className="tabular-nums font-medium">{reporte.total}</span>
        </p>
        <p>
          <span className="text-muted-foreground">Tasa de conversión: </span>
          <span className="tabular-nums font-medium">
            {reporte.conversionRate === null
              ? "—"
              : formatConversionRate(reporte.conversionRate)}
          </span>
        </p>
      </div>

      <DataTable
        columnas={columnas}
        filas={filas}
        idDeFila={(fila) => fila.id}
      />
    </div>
  );
}
