import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { SalaryLogFilters } from "@/features/procesos/components/SalaryLogFilters";
import { getSalaryLogPage } from "@/features/procesos/services/salaries.service";
import { salaryLogQuerySchema } from "@/features/procesos/schemas";
import type { SalaryLogRow } from "@/features/procesos/types";
import { requireSessionUser } from "@/lib/session";

export const metadata: Metadata = { title: "Cambios salariales" };

const formatoFecha = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const formatoImporte = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 2,
});

function frecuenciaDePago(valor: number): string {
  if (valor === 1) return "Mensual";
  if (valor === 2) return "Quincenal";
  return "Frecuencia desconocida";
}

export default async function SalariosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireSessionUser();
  const params = await searchParams;
  const query = salaryLogQuerySchema.parse(params);
  const resultado = await getSalaryLogPage(query);
  const { items, total, page, pageCount } = resultado.success
    ? resultado.data
    : { items: [], total: 0, page: 1, pageCount: 1 };

  const columnas: DataTableColumn<SalaryLogRow>[] = [
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
    {
      id: "rate",
      header: "Tarifa",
      className: "whitespace-nowrap",
      cell: (fila) => formatoImporte.format(fila.rate),
    },
    {
      id: "frequency",
      header: "Frecuencia",
      className: "hidden sm:table-cell",
      cell: (fila) => frecuenciaDePago(fila.payFrequency),
    },
    {
      id: "date",
      header: "Fecha de cambio",
      className: "whitespace-nowrap",
      cell: (fila) => formatoFecha.format(fila.rateChangeDate),
    },
    {
      id: "status",
      header: "Estado",
      cell: (fila) =>
        fila.current ? (
          <Badge variant="secondary">Vigente</Badge>
        ) : (
          <span className="text-muted-foreground">Superado</span>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          Cambios salariales
        </h2>
        <p className="text-muted-foreground text-sm">
          Bitácora de tarifas, ordenada por fecha de cambio.
        </p>
      </div>
      <SalaryLogFilters query={query} />
      <Card className="bg-card/60 overflow-hidden backdrop-blur-xl">
        <CardContent className="p-0">
          <DataTable
            columnas={columnas}
            filas={items}
            idDeFila={(fila) =>
              `${fila.businessEntityId}-${fila.rateChangeDate.toISOString()}`
            }
            claseDeFila={(fila) =>
              fila.current ? "bg-primary/5" : "text-muted-foreground"
            }
            error={resultado.success ? undefined : resultado.error.message}
            vacio="No hay cambios salariales que coincidan con los filtros aplicados."
          />
        </CardContent>
      </Card>
      <Pagination
        page={page}
        pageCount={pageCount}
        total={total}
        basePath="/procesos/salarios"
        params={{ q: query.q, from: query.from, to: query.to }}
        singular="cambio salarial"
        plural="cambios salariales"
      />
    </div>
  );
}
