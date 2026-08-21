import type { Metadata } from "next";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { DeleteDepartmentDialog } from "@/features/departamentos/components/DeleteDepartmentDialog";
import { DepartmentFormDialog } from "@/features/departamentos/components/DepartmentFormDialog";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { SearchInput } from "@/components/shared/SearchInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { DepartmentRow } from "@/features/departamentos/data/department";
import { requireSessionUser } from "@/lib/session";
import { departmentQuerySchema } from "@/features/departamentos/schemas";
import { getDepartmentPage } from "@/features/departamentos/services/department.service";

export const metadata: Metadata = { title: "Departamentos" };

const formatoFecha = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default async function DepartamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  // El proxy ya filtró, pero esta es la comprobación que de verdad protege:
  // corre en el servidor, pegada a la lectura de datos.
  await requireSessionUser();

  const params = await searchParams;
  const query = departmentQuerySchema.parse({ q: params.q, page: params.page });
  const resultado = await getDepartmentPage(query);

  // El fallo se pinta dentro de la propia tabla, no en lugar de la página: la
  // cabecera y el buscador siguen ahí para poder reintentar.
  const { items, total, page, pageCount } = resultado.success
    ? resultado.data
    : { items: [], total: 0, page: 1, pageCount: 1 };

  const columnas: DataTableColumn<DepartmentRow>[] = [
    {
      id: "name",
      header: "Nombre",
      cell: (departamento) => <span className="font-medium">{departamento.name}</span>,
    },
    {
      id: "groupName",
      header: "Grupo",
      className: "text-muted-foreground",
      cell: (departamento) => departamento.groupName,
    },
    {
      id: "modifiedDate",
      header: "Modificado",
      className: "text-muted-foreground hidden sm:table-cell",
      cell: (departamento) => formatoFecha.format(departamento.modifiedDate),
    },
    {
      id: "acciones",
      header: "Acciones",
      className: "w-0 text-right",
      cell: (departamento) => (
        <div className="flex justify-end gap-1">
          <DepartmentFormDialog
            departamento={departamento}
            trigger={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Editar ${departamento.name}`}
              >
                <PencilIcon />
              </Button>
            }
          />
          <DeleteDepartmentDialog
            departmentId={departamento.departmentId}
            name={departamento.name}
            trigger={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Eliminar ${departamento.name}`}
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
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            Departamentos
          </h2>
          <p className="text-muted-foreground text-sm">
            Estructura organizativa heredada de AdventureWorks.
          </p>
        </div>

        <DepartmentFormDialog
          trigger={
            <Button>
              <PlusIcon />
              Nuevo departamento
            </Button>
          }
        />
      </div>

      <SearchInput
        valorInicial={query.q}
        placeholder="Buscar por nombre…"
        etiqueta="Buscar departamentos por nombre"
      />

      <Card className="bg-card/60 overflow-hidden backdrop-blur-xl">
        <CardContent className="p-0">
          <DataTable
            columnas={columnas}
            filas={items}
            idDeFila={(departamento) => departamento.departmentId}
            error={resultado.success ? undefined : resultado.error.message}
            vacio={
              query.q
                ? `No hay departamentos que coincidan con "${query.q}".`
                : "Todavía no hay departamentos registrados."
            }
          />
        </CardContent>
      </Card>

      <Pagination
        page={page}
        pageCount={pageCount}
        total={total}
        basePath="/departamentos"
        params={{ q: query.q }}
        singular="departamento"
        plural="departamentos"
      />
    </div>
  );
}
