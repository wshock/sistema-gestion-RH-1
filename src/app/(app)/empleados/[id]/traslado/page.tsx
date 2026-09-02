import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { listAllDepartments } from "@/features/departamentos/data/department";
import { listAllShifts } from "@/features/turnos/data/shift";
import { TransferForm } from "@/features/empleados/components/TransferForm";
import { Card, CardContent } from "@/components/ui/card";
import { requireSessionUser } from "@/lib/session";
import {
  employeeIdSchema,
  MENSAJE_SIN_ASIGNACION_VIGENTE,
} from "@/features/empleados/schemas";
import { getEmployeeDetailAction } from "@/features/empleados/actions/read";

export const metadata: Metadata = { title: "Traslado" };

export default async function TrasladoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
  const vigente = empleado.currentAssignment;

  const [departamentos, turnos] = await Promise.all([
    listAllDepartments(),
    listAllShifts(),
  ]);

  return (
    <div className="space-y-4">
      <VolverAFicha id={String(empleado.businessEntityId)} />

      <div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">Traslado</h2>
        <p className="text-muted-foreground text-sm">
          {empleado.lastName}, {empleado.firstName} · {empleado.jobTitle}
        </p>
      </div>

      {vigente ? (
        <TransferForm
          businessEntityId={empleado.businessEntityId}
          hireDate={empleado.hireDate}
          currentAssignment={vigente}
          departamentos={departamentos}
          turnos={turnos}
        />
      ) : (
        <Card className="bg-card/60 backdrop-blur-xl">
          <CardContent>
            <p className="text-sm" role="status">
              {MENSAJE_SIN_ASIGNACION_VIGENTE}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function VolverAFicha({ id }: { id: string }) {
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
