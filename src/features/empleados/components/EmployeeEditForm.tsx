"use client";

import { useRouter } from "next/navigation";
import { useForm, type Path, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { updateEmployeeAction } from "@/features/empleados/actions/employee";
import { EmployeePersonJobFields } from "@/features/empleados/components/EmployeePersonJobFields";
import { Button } from "@/components/ui/button";
import { employeeEditSchema, type EmployeeEditInput } from "@/features/empleados/schemas";
import type { EmployeeDetail } from "@/features/empleados/types";

/**
 * Formulario de edición de empleado.
 *
 * Deliberadamente sin departamento, turno ni salario: `employeeEditSchema`
 * no los declara, así que ni siquiera compilaría intentar registrarlos acá.
 * Esos cambian por traslado y cambio salarial (Sprint 3), que dejan
 * historial; editarlos junto con el resto de la ficha lo destruiría.
 */
export function EmployeeEditForm({ empleado }: { empleado: EmployeeDetail }) {
  const router = useRouter();

  const valoresIniciales: EmployeeEditInput = {
    title: empleado.title ?? "",
    firstName: empleado.firstName,
    middleName: empleado.middleName ?? "",
    lastName: empleado.lastName,
    suffix: empleado.suffix ?? "",
    nationalIdNumber: empleado.nationalIdNumber,
    loginId: empleado.loginId,
    jobTitle: empleado.jobTitle,
    birthDate: empleado.birthDate,
    maritalStatus: empleado.maritalStatus,
    gender: empleado.gender,
    hireDate: empleado.hireDate,
    salariedFlag: empleado.salariedFlag,
    vacationHours: empleado.vacationHours,
    sickLeaveHours: empleado.sickLeaveHours,
  };

  const form = useForm<EmployeeEditInput>({
    resolver: zodResolver(employeeEditSchema) as Resolver<EmployeeEditInput>,
    defaultValues: valoresIniciales,
  });

  const {
    formState: { errors, isSubmitting },
  } = form;

  async function alEnviar(valores: EmployeeEditInput) {
    const resultado = await updateEmployeeAction(empleado.businessEntityId, valores);

    if (resultado.success) {
      toast.success("Empleado actualizado.");
      router.push(`/empleados/${empleado.businessEntityId}`);

      return;
    }

    const { error } = resultado;

    if (error.fieldErrors) {
      for (const [campo, mensajes] of Object.entries(error.fieldErrors)) {
        form.setError(campo as Path<EmployeeEditInput>, { message: mensajes[0] });
      }
    }

    toast.error(error.message);
  }

  return (
    <form onSubmit={form.handleSubmit(alEnviar)} className="space-y-4">
      <EmployeePersonJobFields
        register={form.register}
        control={form.control}
        errors={errors}
      />

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={() => router.push(`/empleados/${empleado.businessEntityId}`)}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
