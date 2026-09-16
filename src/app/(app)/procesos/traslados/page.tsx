import type { Metadata } from "next";
import Link from "next/link";

import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listAllDepartments } from "@/features/departamentos/data/department";
import { listAllShifts } from "@/features/turnos/data/shift";
import { TransferLogFilters } from "@/features/procesos/components/TransferLogFilters";
import { transferLogQuerySchema } from "@/features/procesos/schemas";
import type { TransferLogRow } from "@/features/procesos/types";
import { getTransferLogPage } from "@/features/procesos/services/transfers.service";
import { requireSessionUser } from "@/lib/session";

export const metadata: Metadata = { title: "Traslados de departamento" };

const formatoFecha = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export default async function TrasladosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireSessionUser();
  const params = await searchParams;
  const query = transferLogQuerySchema.parse(params);
  const [resultado, departamentos, turnos] = await Promise.all([
    getTransferLogPage(query),
    listAllDepartments(),
    listAllShifts(),
  ]);
  const { items, total, page, pageCount } = resultado.success
    ? resultado.data
    : { items: [], total: 0, page: 1, pageCount: 1 };

  const columnas: DataTableColumn<TransferLogRow>[] = [
    {
      id: "employee",
      header: "Empleado",
      cell: (fila) => (
        <Link
          className="font-medium hover:underline"
          href={`/empleados/${fila.businessEntityId}`}
        >
          {fila.employeeName}
        </Link>
      ),
    },
    { id: "department", header: "Departamento", cell: (fila) => fila.departmentName },
    {
      id: "shift",
      header: "Turno",
      className: "hidden sm:table-cell",
      cell: (fila) => fila.shiftName,
    },
    {
      id: "startDate",
      header: "Inicio",
      className: "whitespace-nowrap",
      cell: (fila) => formatoFecha.format(new Date(`${fila.startDate}T00:00:00Z`)),
    },
    {
      id: "endDate",
      header: "Fin",
      className: "whitespace-nowrap",
      cell: (fila) =>
        fila.endDate ? (
          formatoFecha.format(new Date(`${fila.endDate}T00:00:00Z`))
        ) : (
          <Badge variant="secondary">Vigente</Badge>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          Traslados de departamento
        </h2>
        <p className="text-muted-foreground text-sm">
          Bitácora de asignaciones, ordenada por fecha de inicio.
        </p>
      </div>
      <TransferLogFilters departamentos={departamentos} turnos={turnos} query={query} />
      <Card className="bg-card/60 overflow-hidden backdrop-blur-xl">
        <CardContent className="p-0">
          <DataTable
            columnas={columnas}
            filas={items}
            idDeFila={(fila) =>
              `${fila.businessEntityId}-${fila.startDate}-${fila.departmentName}-${fila.shiftName}`
            }
            claseDeFila={(fila) =>
              fila.endDate ? "text-muted-foreground" : "bg-primary/5"
            }
            error={resultado.success ? undefined : resultado.error.message}
            vacio="No hay traslados que coincidan con los filtros aplicados."
          />
        </CardContent>
      </Card>
      <Pagination
        page={page}
        pageCount={pageCount}
        total={total}
        basePath="/procesos/traslados"
        params={{
          departmentId: query.departmentId ? String(query.departmentId) : undefined,
          shiftId: query.shiftId ? String(query.shiftId) : undefined,
          from: query.from,
          to: query.to,
        }}
        singular="traslado"
        plural="traslados"
      />
    </div>
  );
}
