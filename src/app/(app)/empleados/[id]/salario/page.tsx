import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { SalaryChangeForm } from "@/features/empleados/components/SalaryChangeForm";
import { requireSessionUser } from "@/lib/session";
import { employeeIdSchema } from "@/features/empleados/schemas";
import { getEmployeeDetailAction } from "@/features/empleados/actions/read";
import { getEmployeeDetail } from "@/features/empleados/services/read.service";
import { formatInstantDate } from "@/features/empleados/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const idValidado = employeeIdSchema.safeParse(id);

  if (!idValidado.success) {
    return { title: "Cambio salarial" };
  }

  const resultado = await getEmployeeDetail(idValidado.data);

  if (!resultado.success) {
    return { title: "Cambio salarial" };
  }

  const { lastName, firstName } = resultado.data;

  return { title: `Cambio salarial — ${lastName}, ${firstName}` };
}

export default async function CambioSalarialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSessionUser();

  const { id } = await params;
  const resultado = await getEmployeeDetailAction(id);

  if (!resultado.success) {
    if (
      resultado.error.code === "NO_ENCONTRADO" ||
      resultado.error.code === "VALIDACION"
    ) {
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
            <p className="text-muted-foreground mt-1 text-sm">
              {resultado.error.code === "VALIDACION"
                ? "El identificador del empleado no es válido."
                : resultado.error.message}
            </p>
          </div>
        </div>
      );
    }

    return (
      <p className="text-destructive text-sm" role="alert">
        {resultado.error.message}
      </p>
    );
  }

  const empleado = resultado.data;
  const vigente = empleado.currentPay;

  return (
    <div className="space-y-4">
      <Link
        href={`/empleados/${empleado.businessEntityId}`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeftIcon className="size-4" />
        Volver a la ficha
      </Link>

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
