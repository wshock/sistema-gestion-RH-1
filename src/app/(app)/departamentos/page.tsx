import type { Metadata } from "next";
import { AlertCircleIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { DeleteDepartmentDialog } from "@/components/departments/DeleteDepartmentDialog";
import { DepartmentFormDialog } from "@/components/departments/DepartmentFormDialog";
import { DepartmentPagination } from "@/components/departments/DepartmentPagination";
import { DepartmentSearch } from "@/components/departments/DepartmentSearch";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireSessionUser } from "@/lib/session";
import { departmentQuerySchema } from "@/schemas/department.schema";
import { getDepartmentPage } from "@/services/department.service";

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

  if (!resultado.success) {
    return (
      <Card className="bg-card/60 backdrop-blur-xl">
        <CardContent className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
          <AlertCircleIcon className="text-destructive size-4 shrink-0" />
          {resultado.error.message}
        </CardContent>
      </Card>
    );
  }

  const { items, total, page, pageCount } = resultado.data;

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

      <DepartmentSearch valorInicial={query.q} />

      <Card className="bg-card/60 overflow-hidden backdrop-blur-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead className="hidden sm:table-cell">Modificado</TableHead>
                <TableHead className="w-0 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-muted-foreground py-10 text-center"
                  >
                    {query.q
                      ? `No hay departamentos que coincidan con "${query.q}".`
                      : "Todavía no hay departamentos registrados."}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((departamento) => (
                  <TableRow key={departamento.departmentId}>
                    <TableCell className="font-medium">{departamento.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {departamento.groupName}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden sm:table-cell">
                      {formatoFecha.format(departamento.modifiedDate)}
                    </TableCell>
                    <TableCell className="text-right">
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
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <DepartmentPagination page={page} pageCount={pageCount} total={total} q={query.q} />
    </div>
  );
}
