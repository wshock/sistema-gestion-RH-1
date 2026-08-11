import type { Metadata } from "next";
import {
  ArrowRightIcon,
  MoonStarIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { SearchInput } from "@/components/shared/SearchInput";
import { DeleteShiftDialog } from "@/components/shifts/DeleteShiftDialog";
import { ShiftFormDialog } from "@/components/shifts/ShiftFormDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ShiftRow } from "@/data/shift";
import { cruzaMedianoche, formatearDuracionDeTurno } from "@/lib/horario";
import { requireSessionUser } from "@/lib/session";
import { shiftQuerySchema } from "@/schemas/shift.schema";
import { getShiftPage } from "@/services/shift.service";

export const metadata: Metadata = { title: "Turnos" };

const formatoFecha = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default async function TurnosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  // El proxy ya filtró, pero esta es la comprobación que de verdad protege:
  // corre en el servidor, pegada a la lectura de datos.
  await requireSessionUser();

  const params = await searchParams;
  const query = shiftQuerySchema.parse({ q: params.q, page: params.page });
  const resultado = await getShiftPage(query);

  // El fallo se pinta dentro de la propia tabla, no en lugar de la página: la
  // cabecera y el buscador siguen ahí para poder reintentar.
  const { items, total, page, pageCount } = resultado.success
    ? resultado.data
    : { items: [], total: 0, page: 1, pageCount: 1 };

  const columnas: DataTableColumn<ShiftRow>[] = [
    {
      id: "name",
      header: "Nombre",
      cell: (turno) => <span className="font-medium">{turno.name}</span>,
    },
    {
      id: "horario",
      header: "Horario",
      cell: (turno) => (
        <span className="flex items-center gap-1.5">
          <span className="tabular-nums">{turno.startTime}</span>
          <ArrowRightIcon className="text-muted-foreground size-3.5 shrink-0" />
          <span className="tabular-nums">{turno.endTime}</span>
          {cruzaMedianoche(turno.startTime, turno.endTime) && (
            <Badge variant="secondary" title="El turno termina al día siguiente">
              <MoonStarIcon />
              Nocturno
            </Badge>
          )}
        </span>
      ),
    },
    {
      id: "duracion",
      header: "Duración",
      className: "text-muted-foreground hidden sm:table-cell",
      cell: (turno) => formatearDuracionDeTurno(turno.startTime, turno.endTime),
    },
    {
      id: "modifiedDate",
      header: "Modificado",
      className: "text-muted-foreground hidden lg:table-cell",
      cell: (turno) => formatoFecha.format(turno.modifiedDate),
    },
    {
      id: "acciones",
      header: "Acciones",
      className: "w-0 text-right",
      cell: (turno) => (
        <div className="flex justify-end gap-1">
          <ShiftFormDialog
            turno={turno}
            trigger={
              <Button variant="ghost" size="icon-sm" aria-label={`Editar ${turno.name}`}>
                <PencilIcon />
              </Button>
            }
          />
          <DeleteShiftDialog
            shiftId={turno.shiftId}
            name={turno.name}
            trigger={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Eliminar ${turno.name}`}
              >
                <Trash2Icon />
              </Button>
            }
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-semibold tracking-tight">Turnos</h2>
          <p className="text-muted-foreground text-sm">
            Jornadas laborales sobre las que se asigna al personal.
          </p>
        </div>

        <ShiftFormDialog
          trigger={
            <Button>
              <PlusIcon />
              Nuevo turno
            </Button>
          }
        />
      </div>

      <SearchInput
        valorInicial={query.q}
        placeholder="Buscar por nombre…"
        etiqueta="Buscar turnos por nombre"
      />

      <Card className="bg-card/60 overflow-hidden backdrop-blur-xl">
        <CardContent className="p-0">
          <DataTable
            columnas={columnas}
            filas={items}
            idDeFila={(turno) => turno.shiftId}
            error={resultado.success ? undefined : resultado.error.message}
            vacio={
              query.q
                ? `No hay turnos que coincidan con "${query.q}".`
                : "Todavía no hay turnos registrados."
            }
          />
        </CardContent>
      </Card>

      <Pagination
        page={page}
        pageCount={pageCount}
        total={total}
        basePath="/turnos"
        params={{ q: query.q }}
        singular="turno"
        plural="turnos"
      />
    </div>
  );
}
