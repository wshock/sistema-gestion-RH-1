import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { SalaryChangeForm } from "@/features/empleados/components/SalaryChangeForm";
import { requireSessionUser } from "@/lib/session";
import { employeeIdSchema } from "@/features/empleados/schemas";
import { getEmployeeDetailAction } from "@/features/empleados/actions/read";
import { formatInstantDate, toUtcCalendarDate } from "@/features/empleados/format";

export const metadata: Metadata = { title: "Cambio salarial" };

export default async function CambioSalarialPage({
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
  const vigente = empleado.currentPay;

  return (
    <div className="space-y-4">
      <VolverAFicha id={String(empleado.businessEntityId)} />

      <div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          Cambio salarial
        </h2>
        <p className="text-muted-foreground text-sm">
          {empleado.lastName}, {empleado.firstName} · {empleado.jobTitle}
        </p>
      </div>

      <SalaryChangeForm
        businessEntityId={empleado.businessEntityId}
        hireDate={empleado.hireDate}
        lastPayDate={vigente ? toUtcCalendarDate(vigente.rateChangeDate) : null}
        currentPay={
          vigente
            ? {
                rate: vigente.rate,
                payFrequency: vigente.payFrequency,
                rateChangeDateLabel: formatInstantDate(vigente.rateChangeDate),
              }
            : null
        }
      />
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
