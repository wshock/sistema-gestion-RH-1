import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { listAllDepartments } from "@/features/departamentos/data/department";
import { listAllShifts } from "@/features/turnos/data/shift";
import { EmployeeForm } from "@/features/empleados/components/EmployeeForm";
import { requireSessionUser } from "@/lib/session";

export const metadata: Metadata = { title: "Nuevo empleado" };

export default async function NuevoEmpleadoPage() {
  await requireSessionUser();

  const [departamentos, turnos] = await Promise.all([
    listAllDepartments(),
    listAllShifts(),
  ]);

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
          Nuevo empleado
        </h2>
        <p className="text-muted-foreground text-sm">
          Registrá a la persona, su cargo y la asignación y el salario con los que
          empieza.
        </p>
      </div>

      <EmployeeForm departamentos={departamentos} turnos={turnos} />
    </div>
  );
}
