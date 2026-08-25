import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { EmployeeAssignmentHistory } from "@/features/empleados/components/EmployeeAssignmentHistory";
import { EmployeeDetailActions } from "@/features/empleados/components/EmployeeDetailActions";
import { EmployeeDetailSections } from "@/features/empleados/components/EmployeeDetailSections";
import { EmployeePayHistory } from "@/features/empleados/components/EmployeePayHistory";
import { Badge } from "@/components/ui/badge";
import { requireSessionUser } from "@/lib/session";
import { employeeIdSchema } from "@/features/empleados/schemas";
import { getEmployeeDetailAction } from "@/features/empleados/actions/read";
import { getEmployeeDetail } from "@/features/empleados/services/read.service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const idValidado = employeeIdSchema.safeParse(id);

  if (!idValidado.success) {
    return { title: "Empleado" };
  }

  const resultado = await getEmployeeDetail(idValidado.data);

  if (!resultado.success) {
    return { title: "Empleado" };
  }

  const { lastName, firstName } = resultado.data;

  return { title: `${lastName}, ${firstName}` };
}

export default async function EmpleadoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // El proxy ya filtró, pero esta es la comprobación que de verdad protege:
  // corre en el servidor, pegada a la lectura de datos.
  await requireSessionUser();

  const { id } = await params;
  const resultado = await getEmployeeDetailAction(id);

  if (!resultado.success) {
    if (
      resultado.error.code === "NO_ENCONTRADO" ||
      resultado.error.code === "VALIDACION"
    ) {
      return (
        <FichaNoEncontrada
          mensaje={
            resultado.error.code === "VALIDACION"
              ? "El identificador del empleado no es válido."
              : resultado.error.message
          }
        />
      );
    }

    return (
      <p className="text-destructive text-sm" role="alert">
        {resultado.error.message}
      </p>
    );
  }

  const empleado = resultado.data;

  return (
    <div className="space-y-4">
      <Link
        href="/empleados"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeftIcon className="size-4" />
        Volver al listado
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            {empleado.lastName}, {empleado.firstName}
          </h2>
          <p className="text-muted-foreground text-sm">{empleado.jobTitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={empleado.currentFlag ? "secondary" : "outline"}>
            {empleado.currentFlag ? "Activo" : "Inactivo"}
          </Badge>

          {/* Hueco de HU-27 y HU-28: edición y baja. Hoy el marcador no pinta. */}
          <EmployeeDetailActions empleado={empleado} />
        </div>
      </div>

      <EmployeeDetailSections empleado={empleado} />

      <div className="grid gap-4 lg:grid-cols-2">
        <EmployeeAssignmentHistory history={empleado.assignmentHistory} />
        <EmployeePayHistory history={empleado.payHistory} />
      </div>
    </div>
  );
}

function FichaNoEncontrada({ mensaje }: { mensaje: string }) {
  return (
    <div className="space-y-4">
      <Link
        href="/empleados"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeftIcon className="size-4" />
        Volver al listado
      </Link>

      <div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          Empleado no encontrado
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">{mensaje}</p>
      </div>
    </div>
  );
}
