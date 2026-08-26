import type { Metadata } from "next";
import Link from "next/link";

import { listAllDepartments } from "@/features/departamentos/data/department";
import { listAllShifts } from "@/features/turnos/data/shift";
import { EmployeeCreateButton } from "@/features/empleados/components/EmployeeCreateButton";
import { EmployeeFilters } from "@/features/empleados/components/EmployeeFilters";
import { EmployeeRowActions } from "@/features/empleados/components/EmployeeRowActions";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { SearchInput } from "@/components/shared/SearchInput";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { EmployeeListItem } from "@/features/empleados/types";
import { requireSessionUser } from "@/lib/session";
import { employeeQuerySchema } from "@/features/empleados/schemas";
import { getEmployeePage } from "@/features/empleados/services/read.service";

export const metadata: Metadata = { title: "Empleados" };

export default async function EmpleadosPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    page?: string;
    departmentId?: string;
    shiftId?: string;
    estado?: string;
  }>;
}) {
  // El proxy ya filtró, pero esta es la comprobación que de verdad protege:
  // corre en el servidor, pegada a la lectura de datos.
  await requireSessionUser();

  const params = await searchParams;
  const query = employeeQuerySchema.parse(params);

  const [resultado, departamentos, turnos] = await Promise.all([
    getEmployeePage(query),
    listAllDepartments(),
    listAllShifts(),
  ]);

  // El fallo se pinta dentro de la propia tabla, no en lugar de la página: la
  // cabecera, la búsqueda y los filtros siguen ahí para poder reintentar.
  const { items, total, page, pageCount } = resultado.success
    ? resultado.data
    : { items: [], total: 0, page: 1, pageCount: 1 };

  const hayFiltros =
    Boolean(query.q) ||
    query.departmentId !== undefined ||
    query.shiftId !== undefined ||
    query.estado !== "todos";

  const columnas: DataTableColumn<EmployeeListItem>[] = [
    {
      id: "nombre",
      header: "Nombre",
      cell: (empleado) => (
        <Link
          href={`/empleados/${empleado.businessEntityId}`}
          className="font-medium hover:underline"
        >
          {empleado.lastName}, {empleado.firstName}
        </Link>
      ),
    },
    {
      id: "nationalIdNumber",
      header: "Documento",
      className: "text-muted-foreground",
      cell: (empleado) => empleado.nationalIdNumber,
    },
    {
      id: "jobTitle",
      header: "Cargo",
      cell: (empleado) => empleado.jobTitle,
    },
    {
      id: "departmentName",
      header: "Departamento",
      className: "text-muted-foreground",
      cell: (empleado) => empleado.departmentName ?? "Sin asignación vigente",
    },
    {
      id: "shiftName",
      header: "Turno",
      className: "text-muted-foreground hidden sm:table-cell",
      cell: (empleado) => empleado.shiftName ?? "Sin asignación vigente",
    },
    {
      id: "estado",
      header: "Estado",
      cell: (empleado) => (
        <Badge variant={empleado.currentFlag ? "secondary" : "outline"}>
          {empleado.currentFlag ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    {
      id: "acciones",
      header: "Acciones",
      className: "w-0 text-right",
      cell: (empleado) => <EmployeeRowActions empleado={empleado} />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            Empleados
          </h2>
          <p className="text-muted-foreground text-sm">
            Personal registrado, migrado desde AdventureWorks.
          </p>
        </div>

        <EmployeeCreateButton />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Con clave en `query.q`: al limpiar filtros la URL pierde `q` y el
            input debe reiniciar su estado local, no arrastrar lo escrito. */}
        <SearchInput
          key={query.q}
          valorInicial={query.q}
          placeholder="Buscar por nombre o documento…"
          etiqueta="Buscar empleados por nombre o documento"
        />

        <EmployeeFilters departamentos={departamentos} turnos={turnos} query={query} />
      </div>

      <Card className="bg-card/60 overflow-hidden backdrop-blur-xl">
        <CardContent className="p-0">
          <DataTable
            columnas={columnas}
            filas={items}
            idDeFila={(empleado) => empleado.businessEntityId}
            claseDeFila={(empleado) =>
              empleado.currentFlag ? undefined : "text-muted-foreground opacity-70"
            }
            error={resultado.success ? undefined : resultado.error.message}
            vacio={
              hayFiltros
                ? "Ningún empleado coincide con la búsqueda o los filtros aplicados."
                : "Todavía no hay empleados registrados."
            }
          />
        </CardContent>
      </Card>

      <Pagination
        page={page}
        pageCount={pageCount}
        total={total}
        basePath="/empleados"
        params={{
          q: query.q,
          departmentId: query.departmentId ? String(query.departmentId) : undefined,
          shiftId: query.shiftId ? String(query.shiftId) : undefined,
          estado: query.estado !== "todos" ? query.estado : undefined,
        }}
        singular="empleado"
        plural="empleados"
      />
    </div>
  );
}
