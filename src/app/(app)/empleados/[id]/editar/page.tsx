import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { EmployeeEditForm } from "@/features/empleados/components/EmployeeEditForm";
import { requireSessionUser } from "@/lib/session";
import { employeeIdSchema } from "@/features/empleados/schemas";
import { getEmployeeDetailAction } from "@/features/empleados/actions/read";

export const metadata: Metadata = { title: "Editar empleado" };

export default async function EditarEmpleadoPage({
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
    const mensaje =
      resultado.error.code === "VALIDACION"
        ? "El identificador del empleado no es válido."
        : resultado.error.message;

    return (
      <div className="space-y-4">
        <VolverAFicha id={id} />

        <div>
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            Empleado no encontrado
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">{mensaje}</p>
        </div>
      </div>
    );
  }

  const empleado = resultado.data;

  return (
    <div className="space-y-4">
      <VolverAFicha id={String(empleado.businessEntityId)} />

      <div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          Editar {empleado.lastName}, {empleado.firstName}
        </h2>
        <p className="text-muted-foreground text-sm">
          Departamento, turno y salario no se editan acá: se gestionan con traslado y
          cambio salarial, para conservar su historial.
        </p>
      </div>

      <EmployeeEditForm empleado={empleado} />
    </div>
  );
}

function VolverAFicha({ id }: { id: string }) {
  // `id` puede no ser un número válido si la ficha ya no existe; el enlace de
  // todos modos vuelve a la ruta que se estaba editando.
  const idValidado = employeeIdSchema.safeParse(id);
  const destino = idValidado.success ? `/empleados/${idValidado.data}` : "/empleados";

  return (
    <Link
      href={destino}
      className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
    >
      <ArrowLeftIcon className="size-4" />
      Volver a la ficha
    </Link>
  );
}
